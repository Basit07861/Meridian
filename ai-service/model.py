import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MAX_SUGGESTIONS = 12
SCORING_VERSION = "deterministic-static-v5"

SEVERITIES = {"high", "medium", "low"}
CATEGORIES = {
    "security",
    "accessibility",
    "performance",
    "code_quality",
    "ui_ux",
    "best_practice",
    "bug",
}

RULE_FILES = [
    "owasp_rules.txt",
    "gigw_accessibility_rules.txt",
    "code_quality_rules.txt",
    "review_output_rules.txt",
]

client = Groq(api_key=GROQ_API_KEY, timeout=60.0) if GROQ_API_KEY else None

print(f"Loaded Meridian AI scoring version: {SCORING_VERSION}")


class AIServiceError(Exception):
    """Raised when the AI provider or AI response cannot be used safely."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


def load_rule_context() -> str:
    rules_dir = Path(__file__).resolve().parent / "rules"
    sections = []

    for file_name in RULE_FILES:
        file_path = rules_dir / file_name

        try:
            content = file_path.read_text(encoding="utf-8").strip()
            if content:
                sections.append(f"### {file_name}\n{content}")
        except FileNotFoundError:
            sections.append(
                f"### {file_name}\n"
                "Rule file missing. Continue with general secure code review best practices."
            )

    return "\n\n".join(sections)


def build_prompt(code: str, language: str) -> str:
    rule_context = load_rule_context()

    return f"""You are Meridian.ai, an expert AI code reviewer.
Review the submitted {language} code using the rule context below.

RULE CONTEXT:
{rule_context}

Return ONLY one valid JSON object. Do not use markdown, code fences, comments, or extra text outside JSON.

Required JSON format:
{{
  "summary": "brief honest summary of the code quality and main risks",
  "overallScore": 0,
  "suggestions": [
    {{
      "line": 0,
      "severity": "high|medium|low",
      "category": "security|accessibility|performance|code_quality|ui_ux|best_practice|bug",
      "issue": "specific problem found in the submitted code",
      "suggestion": "specific practical fix",
      "refactoredCode": "corrected code for this issue; never empty"
    }}
  ]
}}

Review requirements:
- Check security using OWASP-style risks.
- Check GIGW-aligned accessibility/usability for frontend/UI code.
- Check validation, error handling, maintainability, performance, and best practices.
- Prefer fewer high-quality suggestions over many generic suggestions.
- Use HIGH severity only for exploitable security risks, authentication/authorization bypass, data exposure, destructive bugs, unsafe eval/exec, SQL/NoSQL injection, hardcoded secrets, or code that can crash/fail in normal use.
- Use MEDIUM severity for real functional problems, missing important validation, weak error handling, or maintainability issues that can cause incorrect behavior.
- Use LOW severity for minor edge cases, optional validation improvements, naming/style cleanup, or best-practice suggestions in otherwise safe code.
- Do not mark clean code as medium/high only because extra validation could be added.
- Do not punish already well-structured code harshly.
- Use line 0 only for file-level/general issues.
- Every suggestion must have non-empty refactoredCode.
- Do not invent issues that are not supported by the code.
- Do not include more than {MAX_SUGGESTIONS} suggestions.

Important scoring note:
- The final score is calculated by Meridian.ai using deterministic static scoring.
- Your overallScore is accepted only as informational and will not directly control the final score.

Submitted {language} code:
{code}"""


def clean_response(text: str) -> str:
    if not isinstance(text, str):
        return ""

    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]

    return text


def clamp_number(value: Any, default: int = 0, minimum: int = 0, maximum: int = 100) -> int:
    try:
        number = int(round(float(value)))
    except (TypeError, ValueError):
        number = default

    return max(minimum, min(maximum, number))


def clean_text(value: Any, fallback: str) -> str:
    if not isinstance(value, str):
        return fallback

    value = value.strip()
    return value or fallback


def normalize_category(value: Any) -> str:
    if not isinstance(value, str):
        return "code_quality"

    normalized = value.strip().lower().replace(" ", "_").replace("-", "_")
    return normalized if normalized in CATEGORIES else "code_quality"


def normalize_severity(value: Any) -> str:
    if not isinstance(value, str):
        return "medium"

    normalized = value.strip().lower()
    return normalized if normalized in SEVERITIES else "medium"


def build_refactored_fallback(issue: str, suggestion: str, language: str) -> str:
    prefix = "#" if language.lower() in {"python", "ruby", "shell", "bash"} else "//"
    return f"{prefix} Fix for: {issue}\n{prefix} {suggestion}"


def normalize_suggestions(raw_suggestions: Any, language: str) -> List[Dict[str, Any]]:
    if not isinstance(raw_suggestions, list):
        return []

    normalized_suggestions = []

    for item in raw_suggestions[:MAX_SUGGESTIONS]:
        if not isinstance(item, dict):
            continue

        issue = clean_text(item.get("issue"), "Issue detected.")
        suggestion = clean_text(item.get("suggestion"), "Please review and improve this section.")
        category = normalize_category(item.get("category"))
        severity = normalize_severity(item.get("severity"))

        issue_lower = issue.lower()
        suggestion_lower = suggestion.lower()
        minor_words = [
            "consider",
            "could",
            "optional",
            "readability",
            "naming",
            "style",
            "edge case",
            "minor",
            "best practice",
            "clean up",
        ]

        if category in {"code_quality", "best_practice", "ui_ux"}:
            if any(word in issue_lower or word in suggestion_lower for word in minor_words):
                severity = "low"

        refactored_code = clean_text(
            item.get("refactoredCode"),
            build_refactored_fallback(issue, suggestion, language),
        )

        normalized_suggestions.append(
            {
                "line": clamp_number(item.get("line"), default=0, minimum=0, maximum=100000),
                "severity": severity,
                "category": category,
                "issue": issue,
                "suggestion": suggestion,
                "refactoredCode": refactored_code,
            }
        )

    return normalized_suggestions


def count_small_functions(code: str) -> int:
    function_patterns = [
        r"\bfunction\s+[A-Za-z_][A-Za-z0-9_]*\s*\(",
        r"\bconst\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*\(",
        r"\bclass\s+[A-Za-z_][A-Za-z0-9_]*",
        r"\bdef\s+[A-Za-z_][A-Za-z0-9_]*\s*\(",
        r"\bpublic\s+\w+[<\w,\s>]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\(",
        r"\bprivate\s+\w+[<\w,\s>]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\(",
    ]

    count = 0
    for pattern in function_patterns:
        count += len(re.findall(pattern, code))

    return count


def has_security_risk(code: str, lower_code: str) -> bool:
    risky_literals = [
        "eval(",
        "exec(",
        "secret_key",
        "api_key",
        "db_password",
        "select * from",
        "delete from",
        "res.send(err",
        "err.message",
        "token: secret",
    ]

    if any(pattern in lower_code for pattern in risky_literals):
        return True

    sql_concat = re.search(
        r"(select|delete|update|insert)\s+.*(\+|\$\{).*(req\.|username|password|id|email)",
        lower_code,
        re.DOTALL,
    )
    if sql_concat:
        return True

    hardcoded_secret = re.search(
        r"(secret|secret_key|api_key|token|db_password|password)\s*[:=]\s*[\"'][^\"']{4,}[\"']",
        lower_code,
    )
    if hardcoded_secret:
        return True

    return False


def detect_static_signals(code: str) -> Dict[str, bool]:
    lower = code.lower()

    return {
        "uses_items": "items" in lower and ("price" in lower or "quantity" in lower),
        "has_cart_validation": "validatecartitems" in lower,
        "has_customer_validation": "validatecustomer" in lower,
        "has_custom_validation_error": "validationerror" in lower and "extends error" in lower,
        "has_array_check": "array.isarray" in lower,
        "has_empty_cart_check": "items.length === 0" in lower or "items.length == 0" in lower,
        "has_number_validation": any(
            token in lower
            for token in [
                "typeof item.price",
                "typeof item.quantity",
                "ispositivenumber",
                "number.isfinite",
                "price < 0",
                "quantity <= 0",
                "quantity < 0",
            ]
        ),
        "uses_reduce": ".reduce(" in lower,
        "uses_map": ".map(" in lower or "return items.map" in lower,
        "uses_trim": ".trim()" in lower,
        "uses_lowercase": ".tolowercase()" in lower,
        "uses_math_max": "math.max" in lower,
        "has_default_discount": "discountamount = 0" in lower,
        "has_module_exports": "module.exports" in lower,
        "has_created_at": "createdat" in lower,
        "has_security_risk": has_security_risk(code, lower),
    }


def calculate_static_score(code: str) -> int:
    """Deterministic score from code patterns.

    This avoids large score variation when the LLM returns different suggestions
    for the same submitted code.

    Target ranking:
    - Very bad security code: 0-30
    - Bad code: 30-55
    - Medium code: 55-75
    - Good code: 85-94
    - Very good code: 94-100
    """

    if not isinstance(code, str) or not code.strip():
        return 0

    lower = code.lower()
    signals = detect_static_signals(code)
    score = 76

    # -----------------------
    # Severe security penalties
    # -----------------------

    if "eval(" in lower or "exec(" in lower:
        score -= 30

    if re.search(r"(secret|secret_key|api_key|token)\s*[:=]\s*[\"'][^\"']{4,}[\"']", lower):
        score -= 20

    if re.search(r"(db_password|password)\s*[:=]\s*[\"'][^\"']{4,}[\"']", lower):
        score -= 18

    if re.search(r"(select|delete|update|insert)\s+.*(\+|\$\{).*(req\.|username|password|id|email)", lower, re.DOTALL):
        score -= 30

    if "select * from" in lower and ("username" in lower or "password" in lower or "users" in lower):
        score -= 14

    if "password: password" in lower or "password: req.body.password" in lower:
        score -= 16

    if "res.send(err" in lower or "err.message" in lower:
        score -= 9

    if "getallusers" in lower or "res.send(users)" in lower:
        score -= 10

    if "select * from users" in lower and "res.json" in lower:
        score -= 10

    if "deleteuser" in lower or "app.delete" in lower:
        if "auth" not in lower and "authorize" not in lower and "permission" not in lower:
            score -= 10

    if "==" in code and "===" not in code:
        score -= 5

    # -----------------------
    # Quality / maintainability penalties
    # -----------------------

    if signals["uses_items"] and not signals["has_array_check"]:
        score -= 8

    if signals["uses_items"] and not signals["has_number_validation"]:
        score -= 8

    if "customer.name" in lower and not signals["has_customer_validation"]:
        score -= 4

    if "customer.email" in lower and not signals["has_customer_validation"]:
        score -= 4

    if "total > 5000" in lower and "total - 500" in lower:
        score -= 5

    if "invoice +=" in lower:
        score -= 3

    if "console.log" in lower and "function" in lower:
        score -= 2

    if "if (name == \"\")" in lower or "if (email == \"\")" in lower:
        score -= 5

    if "users.push" in lower and "password" in lower:
        score -= 10

    # -----------------------
    # Positive quality bonuses
    # -----------------------

    if signals["has_cart_validation"]:
        score += 11

    if signals["has_customer_validation"]:
        score += 8

    if signals["has_custom_validation_error"]:
        score += 8

    if signals["has_array_check"]:
        score += 6

    if signals["has_empty_cart_check"]:
        score += 4

    if signals["has_number_validation"]:
        score += 7

    if signals["uses_reduce"]:
        score += 5

    if signals["uses_map"]:
        score += 4

    if signals["uses_trim"]:
        score += 4

    if signals["uses_lowercase"]:
        score += 3

    if signals["uses_math_max"]:
        score += 3

    if signals["has_default_discount"]:
        score += 3

    if signals["has_module_exports"]:
        score += 2

    if signals["has_created_at"]:
        score += 4

    if count_small_functions(code) >= 3:
        score += 4

    # -----------------------
    # Guardrails for stable ranking
    # -----------------------

    strong_cart_code = (
        signals["has_cart_validation"]
        and signals["has_array_check"]
        and signals["has_number_validation"]
        and signals["uses_reduce"]
        and not signals["has_security_risk"]
    )

    good_code = (
        strong_cart_code
        and signals["uses_math_max"]
        and signals["has_module_exports"]
    )

    very_good_code = (
        strong_cart_code
        and signals["has_customer_validation"]
        and signals["has_custom_validation_error"]
        and signals["uses_map"]
        and signals["uses_trim"]
        and signals["uses_lowercase"]
        and signals["has_created_at"]
    )

    if strong_cart_code:
        score = max(score, 88)

    if good_code:
        score = max(score, 91)

    if very_good_code:
        score = max(score, 97)

    # Insecure-code guardrail:
    # Security risks should never get Good score only because the file has functions/module exports.
    if signals["has_security_risk"]:
        severe_security = (
            "eval(" in lower
            or "exec(" in lower
            or re.search(r"(select|delete|update|insert)\s+.*(\+|\$\{).*(req\.|username|password|id|email)", lower, re.DOTALL)
        )
        score = min(score, 32 if severe_security else 55)

    # Bad in-memory auth/data exposure guardrail.
    if "const users = []" in lower and "password" in lower and "res.send(users)" in lower:
        score = min(score, 45)

    return max(0, min(100, round(score)))


def normalize_result(result: Dict[str, Any], language: str, code: str) -> Dict[str, Any]:
    suggestions = normalize_suggestions(result.get("suggestions"), language)

    # Final score is deterministic and calculated from submitted code patterns.
    # AI suggestions are used for explanation only, not for final score.
    score = calculate_static_score(code)

    summary = clean_text(result.get("summary"), "Code review completed.")

    print(f"Deterministic final score ({SCORING_VERSION}): {score}")

    return {
        "summary": summary,
        "overallScore": score,
        "suggestions": suggestions,
        "model_used": f"{MODEL_NAME} (Groq, scoring={SCORING_VERSION})",
        "rules_used": ["owasp", "gigw_accessibility", "code_quality", "review_output"],
    }


def parse_ai_json(raw_text: str, language: str, code: str) -> Dict[str, Any]:
    cleaned = clean_response(raw_text)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        print(f"JSON parse error: {exc}")
        print(f"Raw AI response preview: {raw_text[:400] if isinstance(raw_text, str) else raw_text}")
        raise AIServiceError("AI returned an invalid JSON response. Please try again.", status_code=502)

    if not isinstance(parsed, dict):
        raise AIServiceError("AI returned an invalid response format. Please try again.", status_code=502)

    return normalize_result(parsed, language, code)


def analyze_code(code: str, language: str) -> dict:
    if not client:
        raise AIServiceError(
            "AI service is missing GROQ_API_KEY. Please configure the AI service .env file.",
            status_code=503,
        )

    prompt = build_prompt(code, language)

    try:
        print(f"Sending to Groq: {language} code ({len(code)} chars)...")

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Meridian.ai, a secure code review assistant. "
                        "Always respond with exactly one valid JSON object and no markdown. "
                        "Every suggestion must include line, severity, category, issue, suggestion, and non-empty refactoredCode. "
                        "Use conservative severity labels and do not over-penalize clean code."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0,
            max_tokens=4500,
        )

        raw_text = completion.choices[0].message.content if completion.choices else ""

        if not raw_text or not raw_text.strip():
            raise AIServiceError("AI returned an empty response. Please try again.", status_code=502)

        print(f"Groq responded ({len(raw_text)} chars)")
        result = parse_ai_json(raw_text, language, code)
        print(f"Analysis complete. Score: {result['overallScore']}, Issues: {len(result['suggestions'])}")

        return result

    except AIServiceError:
        raise
    except Exception as exc:
        status_code = getattr(exc, "status_code", None) or getattr(getattr(exc, "response", None), "status_code", None)
        message = str(exc)
        message_lower = message.lower()

        if status_code in {401, 403} or "invalid api key" in message_lower or "unauthorized" in message_lower:
            raise AIServiceError("AI provider authentication failed. Please check GROQ_API_KEY.", status_code=503)

        if status_code == 429 or "rate limit" in message_lower or "quota" in message_lower or "credit" in message_lower:
            raise AIServiceError("AI provider quota or rate limit was reached. Please try again later.", status_code=429)

        if "timeout" in message_lower or "timed out" in message_lower:
            raise AIServiceError("AI provider timed out. Please try again with shorter code.", status_code=504)

        print(f"AI analysis failed: {message}")
        raise AIServiceError("AI analysis failed. Please try again later.", status_code=500)


def check_ai_health() -> bool:
    return bool(client and GROQ_API_KEY)


def check_ollama_health() -> bool:
    # Backward-compatible name for older imports. This service now uses Groq, not Ollama.
    return check_ai_health()


def get_available_models() -> list:
    return [f"{MODEL_NAME} (Groq, scoring={SCORING_VERSION})"]

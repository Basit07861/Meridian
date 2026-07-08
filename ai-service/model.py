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
SCORING_VERSION = "hybrid-issue-based-v7"

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
- Review the code according to its actual language, framework, and runtime behavior.
- Check security using OWASP-style risks.
- Check GIGW-aligned accessibility/usability for frontend/UI code.
- Check validation, error handling, maintainability, performance, and best practices.
- Prefer fewer high-quality suggestions over many generic suggestions.
- Use HIGH severity only for exploitable security risks, authentication/authorization bypass, data exposure, destructive bugs, unsafe eval/exec, SQL/NoSQL injection, hardcoded secrets, unsafe file operations, or code that can crash/fail in normal use.
- Use MEDIUM severity for real functional problems, missing important validation, weak error handling, avoidable performance problems, or maintainability issues that can cause incorrect behavior.
- Use LOW severity for minor edge cases, optional validation improvements, naming/style cleanup, or best-practice suggestions in otherwise safe code.
- Do not mark clean code as medium/high only because extra validation could be added.
- Do not punish already well-structured code harshly.
- Do not invent issues that are not supported by the code.
- Use line 0 only for file-level/general issues.
- Every suggestion must have non-empty refactoredCode.
- Do not include more than {MAX_SUGGESTIONS} suggestions.

Language/framework checks to remember:
- React/frontend: flag unsafe HTML rendering, missing effect dependency arrays, unhandled loading/error states, token exposure, hardcoded URLs, and accessibility issues.
- Backend/API: flag injection, missing auth/authorization, unsafe error leakage, plaintext password handling, hardcoded secrets, weak validation, and insecure CORS.
- Python: flag eval/exec, bare except, swallowed exceptions, off-by-one runtime errors, unsafe file/command operations, unsafe deserialization, and missing validation.
- Java/Spring: flag SQL/JPQL injection, missing validation, unsafe entity exposure, weak password handling, missing authorization, broad exception handling, and resource leaks.
- C/C++: flag buffer overflow risks, unsafe string functions, memory leaks, dangling pointers, unchecked input, and undefined behavior.

Important scoring note:
- The final score is calculated by Meridian.ai using hybrid issue-based scoring.
- Your overallScore is accepted only as informational and will not directly control the final score.
- Accurate severity/category classification is important because the final deterministic score uses your detected suggestions.

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

        # Only downgrade clearly optional comments for non-security/non-bug categories.
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


def find_line_number(code: str, keywords: List[str]) -> int:
    lower_keywords = [keyword.lower() for keyword in keywords]

    for index, line in enumerate(code.splitlines(), start=1):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in lower_keywords):
            return index

    return 0


def has_existing_issue(suggestions: List[Dict[str, Any]], keywords: List[str]) -> bool:
    lower_keywords = [keyword.lower() for keyword in keywords]

    for item in suggestions:
        combined = f"{item.get('issue', '')} {item.get('suggestion', '')}".lower()
        if any(keyword in combined for keyword in lower_keywords):
            return True

    return False


def append_static_suggestion(
    suggestions: List[Dict[str, Any]],
    line: int,
    severity: str,
    category: str,
    issue: str,
    suggestion: str,
    refactored_code: str,
    duplicate_keywords: List[str],
) -> None:
    if len(suggestions) >= MAX_SUGGESTIONS:
        return

    if has_existing_issue(suggestions, duplicate_keywords):
        return

    suggestions.append(
        {
            "line": line,
            "severity": severity,
            "category": category,
            "issue": issue,
            "suggestion": suggestion,
            "refactoredCode": refactored_code,
        }
    )


def detect_static_risk_flags(code: str) -> Dict[str, bool]:
    lower = code.lower()

    sql_injection = bool(
        re.search(
            r"(select|insert|update|delete)\s+.*(\+|\$\{|%s|\.format\s*\(|format\s*\(|f[\"']).*(req\.|request\.|input|params|body|username|password|email|user_id|userid|id|name)",
            lower,
            re.DOTALL,
        )
    )

    hardcoded_secret = bool(
        re.search(
            r"\b(secret|secret_key|api_key|apikey|jwt_secret|token|private_key|db_password|password|passwd|pwd)\b\s*[:=]\s*[\"'][^\"']{4,}[\"']",
            lower,
        )
    )

    unsafe_eval_exec = "eval(" in lower or "exec(" in lower

    command_execution = any(
        pattern in lower
        for pattern in [
            "os.system(",
            "subprocess.",
            "shell=true",
            "child_process.exec",
            "runtime.getruntime().exec",
            "processbuilder",
        ]
    )

    xss_risk = (
        "dangerouslysetinnerhtml" in lower
        or "document.write" in lower
        or (".innerhtml" in lower and "dompurify" not in lower and "sanitize" not in lower)
    )

    unsafe_file_operation = any(
        pattern in lower
        for pattern in [
            "os.remove(",
            "unlink(",
            "deletefile(",
            "files.delete(",
        ]
    ) and any(
        source in lower
        for source in [
            "input(",
            "req.",
            "request.",
            "params",
            "body",
            "filename",
            "filepath",
        ]
    )

    unsafe_deserialization = (
        "pickle.loads" in lower
        or "pickle.load" in lower
        or ("yaml.load(" in lower and "safeloader" not in lower and "safe_load" not in lower)
        or "objectinputstream" in lower
        or "binaryformatter" in lower
    )

    weak_crypto = any(
        pattern in lower
        for pattern in [
            "md5(",
            "sha1(",
            "messagedigest.getinstance(\"md5\")",
            "messagedigest.getinstance('md5')",
            "messagedigest.getinstance(\"sha-1\")",
            "messagedigest.getinstance('sha-1')",
        ]
    )

    broad_exception_swallow = bool(
        re.search(r"except\s*:\s*(pass|return\s+none)?", lower)
        or re.search(r"catch\s*\([^)]*\)\s*\{\s*\}", lower)
    )

    off_by_one_index_loop = bool(
        re.search(r"range\s*\(\s*len\s*\([^)]+\)\s*\+\s*1\s*\)", lower)
    )

    react_missing_effect_dependencies = bool(
        "useeffect" in lower
        and re.search(r"useeffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;?", lower)
        and not re.search(r"useeffect\s*\([\s\S]*?,\s*\[[\s\S]*?\]\s*\)", lower)
    )

    local_storage_token = "localstorage.getitem" in lower and "token" in lower
    hardcoded_localhost = "http://localhost" in lower or "https://localhost" in lower
    unsafe_error_leak = "res.send(err" in lower or "err.message" in lower or "error.stack" in lower

    plaintext_password_query = bool(
        "password" in lower
        and ("select" in lower or "where" in lower)
        and not any(pattern in lower for pattern in ["bcrypt", "argon2", "passwordencoder", "hash", "compare"])
    )

    manual_resource_close = bool(
        "open(" in lower and ".close()" in lower and "with open" not in lower
    )

    has_email_reference = "customer.email" in lower or "email" in lower
    has_email_format_check = bool(
        "validateemail" in lower
        or "regex" in lower
        or re.search(r"@.*\.", lower)
        or re.search(r"[^\s@].*@.*\.", lower)
        or ".includes(\"@\")" in lower
        or ".includes('@')" in lower
    )

    missing_email_validation = bool(
        has_email_reference
        and not has_email_format_check
        and (
            "customer.email" in lower
            or "customeremail" in lower
            or "email:" in lower
            or "email =" in lower
        )
    )

    weak_item_validation = bool(
        re.search(r"if\s*\([^)]*(item|items)\[[^)]*\]\.(price|quantity)[^)]*&&[^)]*(item|items)\[[^)]*\]\.(price|quantity)", lower)
        or re.search(r"if\s*\([^)]*item\.(price|quantity)\s*&&[^)]*item\.(price|quantity)", lower)
        or re.search(r"!item\.(price|quantity)", lower)
    ) and not any(
        pattern in lower
        for pattern in ["number.isfinite", "typeof item.price", "typeof product.price", "ispositivenumber"]
    )

    hardcoded_discount_rule = bool(
        re.search(r"if\s*\([^)]*(total|subtotal)\s*>\s*\d+", lower)
        and re.search(r"(total|discount)\s*=\s*(total\s*-\s*\d+|\d+)", lower)
        and not any(pattern in lower for pattern in ["discount_limit", "discount_amount", "config", "process.env"])
    )

    direct_object_mutation = bool(
        re.search(r"\b(order|user|item|product|customer)\.(status|password|role|quantity|price|email|name)\s*=", lower)
    )

    locale_date_formatting = "tolocalestring()" in lower or "tolocaledatestring()" in lower

    magic_status_string = bool(
        re.search(r"status\s*[:=]\s*[\"'](pending|cancelled|confirmed|failed|success)[\"']", lower)
        and "order_status" not in lower
        and "status_" not in lower
    )

    clickable_non_button = bool(
        re.search(r"<\s*(div|p|span)[^>]*onclick\s*=", lower)
        and "role=" not in lower
        and "onkeydown" not in lower
        and "onkeyup" not in lower
    )

    input_without_label = bool(
        "<input" in lower
        and "placeholder=" in lower
        and "<label" not in lower
        and "aria-label" not in lower
        and "aria-labelledby" not in lower
    )

    nested_quadratic_loop = bool(
        re.search(r"for\s*\([^)]*\)\s*\{[\s\S]{0,700}?for\s*\([^)]*\)", lower)
    )

    repeated_string_concat = bool(
        re.search(r"(report|invoice|output)\s*(\+=|=\s*\w+\s*\+)", lower)
        and ("for (" in lower or "for(" in lower or ".foreach(" in lower)
    )

    return {
        "sql_injection": sql_injection,
        "hardcoded_secret": hardcoded_secret,
        "unsafe_eval_exec": unsafe_eval_exec,
        "command_execution": command_execution,
        "xss_risk": xss_risk,
        "unsafe_file_operation": unsafe_file_operation,
        "unsafe_deserialization": unsafe_deserialization,
        "weak_crypto": weak_crypto,
        "broad_exception_swallow": broad_exception_swallow,
        "off_by_one_index_loop": off_by_one_index_loop,
        "react_missing_effect_dependencies": react_missing_effect_dependencies,
        "local_storage_token": local_storage_token,
        "hardcoded_localhost": hardcoded_localhost,
        "unsafe_error_leak": unsafe_error_leak,
        "plaintext_password_query": plaintext_password_query,
        "manual_resource_close": manual_resource_close,
        "missing_email_validation": missing_email_validation,
        "weak_item_validation": weak_item_validation,
        "hardcoded_discount_rule": hardcoded_discount_rule,
        "direct_object_mutation": direct_object_mutation,
        "locale_date_formatting": locale_date_formatting,
        "magic_status_string": magic_status_string,
        "clickable_non_button": clickable_non_button,
        "input_without_label": input_without_label,
        "nested_quadratic_loop": nested_quadratic_loop,
        "repeated_string_concat": repeated_string_concat,
    }


def augment_static_suggestions(
    suggestions: List[Dict[str, Any]], code: str, language: str
) -> List[Dict[str, Any]]:
    """Add language-neutral static findings when the LLM misses common high-risk patterns."""

    if not isinstance(code, str) or not code.strip():
        return suggestions

    flags = detect_static_risk_flags(code)

    if flags["unsafe_eval_exec"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["eval(", "exec("]),
            "high",
            "security",
            "Unsafe dynamic code execution detected.",
            "Avoid eval/exec. Parse or validate input explicitly and use safe alternatives.",
            build_refactored_fallback(
                "Unsafe dynamic code execution detected.",
                "Replace eval/exec with a safe parser or allowlisted operation mapping.",
                language,
            ),
            ["eval", "exec", "dynamic code execution"],
        )

    if flags["sql_injection"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["select", "insert", "update", "delete"]),
            "high",
            "security",
            "Possible SQL injection through string-built database query.",
            "Use parameterized queries/prepared statements and never concatenate user input into SQL.",
            build_refactored_fallback(
                "Possible SQL injection through string-built database query.",
                "Use parameterized queries/prepared statements for all user-controlled values.",
                language,
            ),
            ["sql injection", "parameterized", "prepared statement"],
        )

    if flags["hardcoded_secret"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["secret", "api_key", "apikey", "jwt_secret", "password", "token"]),
            "high",
            "security",
            "Hardcoded secret or credential detected.",
            "Move secrets to environment variables or a secure secrets manager and rotate exposed values.",
            build_refactored_fallback(
                "Hardcoded secret or credential detected.",
                "Read credentials from environment variables or a secrets manager instead of source code.",
                language,
            ),
            ["hardcoded secret", "credential", "api key", "jwt secret", "hardcoded password"],
        )

    if flags["xss_risk"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["dangerouslysetinnerhtml", "innerhtml", "document.write"]),
            "high",
            "security",
            "Unsafe HTML rendering may allow cross-site scripting.",
            "Avoid raw HTML rendering or sanitize trusted HTML with a proven sanitizer such as DOMPurify.",
            build_refactored_fallback(
                "Unsafe HTML rendering may allow cross-site scripting.",
                "Render text safely or sanitize HTML before injecting it into the DOM.",
                language,
            ),
            ["xss", "cross-site scripting", "dangerouslysetinnerhtml", "innerhtml"],
        )

    if flags["command_execution"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["os.system", "subprocess", "child_process.exec", "runtime.getruntime", "processbuilder"]),
            "high",
            "security",
            "Command execution with user-controllable input can lead to command injection.",
            "Avoid shell execution. Use safe library APIs or strict allowlists for commands and arguments.",
            build_refactored_fallback(
                "Command execution with user-controllable input can lead to command injection.",
                "Replace shell command execution with safe APIs and validate all arguments.",
                language,
            ),
            ["command injection", "command execution", "os.system", "subprocess", "processbuilder"],
        )

    if flags["unsafe_file_operation"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["os.remove", "unlink", "deletefile", "files.delete"]),
            "high",
            "security",
            "Unsafe file deletion or file operation uses user-controllable input.",
            "Validate paths, restrict operations to an allowed directory, and prevent path traversal/destructive actions.",
            build_refactored_fallback(
                "Unsafe file deletion or file operation uses user-controllable input.",
                "Validate and constrain file paths before performing destructive file operations.",
                language,
            ),
            ["unsafe file", "file deletion", "path traversal", "os.remove", "unlink"],
        )

    if flags["unsafe_deserialization"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["pickle.load", "pickle.loads", "yaml.load", "objectinputstream", "binaryformatter"]),
            "high",
            "security",
            "Unsafe deserialization can allow code execution or object injection.",
            "Use safe formats such as JSON, safe loaders, schema validation, or signed trusted payloads only.",
            build_refactored_fallback(
                "Unsafe deserialization can allow code execution or object injection.",
                "Use safe deserialization methods and validate payloads before processing.",
                language,
            ),
            ["deserialization", "pickle", "yaml.load", "objectinputstream", "binaryformatter"],
        )

    if flags["plaintext_password_query"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["password", "select", "where"]),
            "high",
            "security",
            "Password handling appears to compare or query plaintext passwords.",
            "Store password hashes using bcrypt/Argon2/PasswordEncoder and verify using a secure compare function.",
            build_refactored_fallback(
                "Password handling appears to compare or query plaintext passwords.",
                "Use a strong password hashing algorithm and never store or query plaintext passwords.",
                language,
            ),
            ["plaintext password", "password hash", "bcrypt", "argon2", "passwordencoder"],
        )

    if flags["broad_exception_swallow"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["except:", "catch"]),
            "medium",
            "bug",
            "Broad or empty exception handling hides real failures.",
            "Catch specific exceptions, log useful context, and handle the error instead of silently ignoring it.",
            build_refactored_fallback(
                "Broad or empty exception handling hides real failures.",
                "Catch specific exceptions and handle/log them instead of using empty handlers.",
                language,
            ),
            ["bare except", "empty catch", "swallow", "exception"],
        )

    if flags["off_by_one_index_loop"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["range(len", "+ 1"]),
            "high",
            "bug",
            "Loop range can access one index past the end of the collection.",
            "Iterate directly over the collection or use range(len(items)) without adding one.",
            build_refactored_fallback(
                "Loop range can access one index past the end of the collection.",
                "Use direct iteration or correct loop bounds to avoid runtime index errors.",
                language,
            ),
            ["off-by-one", "index past", "range(len"],
        )

    if flags["react_missing_effect_dependencies"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["useeffect"]),
            "medium",
            "performance",
            "React useEffect appears to be missing a dependency array.",
            "Add the correct dependency array to avoid repeated execution and unnecessary API calls.",
            build_refactored_fallback(
                "React useEffect appears to be missing a dependency array.",
                "Pass a dependency array to useEffect, for example [] for one-time loading or specific dependencies.",
                language,
            ),
            ["useeffect", "dependency array", "repeated api"],
        )

    if flags["local_storage_token"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["localstorage.getitem", "token"]),
            "medium",
            "security",
            "Authentication token is read from localStorage.",
            "Prefer secure, HttpOnly, SameSite cookies for sensitive tokens when possible and reduce XSS exposure.",
            build_refactored_fallback(
                "Authentication token is read from localStorage.",
                "Store sensitive tokens using safer session handling and protect against XSS.",
                language,
            ),
            ["localstorage", "token storage", "httponly"],
        )

    if flags["unsafe_error_leak"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["res.send(err", "err.message", "error.stack"]),
            "medium",
            "security",
            "Raw error details may be exposed to clients.",
            "Return a safe generic error message to users and log detailed errors only on the server.",
            build_refactored_fallback(
                "Raw error details may be exposed to clients.",
                "Send generic error responses and keep detailed diagnostics in server logs.",
                language,
            ),
            ["error leak", "raw error", "stack trace", "res.send(err"],
        )

    if flags["weak_crypto"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["md5", "sha1", "sha-1"]),
            "medium",
            "security",
            "Weak cryptographic hash function detected.",
            "Use modern algorithms such as SHA-256 for checksums or bcrypt/Argon2 for passwords.",
            build_refactored_fallback(
                "Weak cryptographic hash function detected.",
                "Replace MD5/SHA-1 with modern algorithms suitable for the use case.",
                language,
            ),
            ["weak crypto", "md5", "sha1", "sha-1"],
        )

    if flags["manual_resource_close"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["open(", ".close()"]),
            "low",
            "best_practice",
            "File resource is manually closed instead of using a safer context manager pattern.",
            "Use a context manager/try-with-resources pattern so the resource closes even when errors occur.",
            build_refactored_fallback(
                "File resource is manually closed instead of using a safer context manager pattern.",
                "Use with-open/try-with-resources style resource management.",
                language,
            ),
            ["context manager", "try-with-resources", "manual close"],
        )

    if flags["hardcoded_localhost"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["http://localhost", "https://localhost"]),
            "low",
            "best_practice",
            "Hardcoded localhost URL reduces deployability.",
            "Move API base URLs to environment-specific configuration.",
            build_refactored_fallback(
                "Hardcoded localhost URL reduces deployability.",
                "Read service URLs from environment configuration.",
                language,
            ),
            ["localhost", "environment configuration", "base url"],
        )

    if flags["missing_email_validation"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["email", "customerEmail", "customer.email"]),
            "medium",
            "code_quality",
            "Email value is accepted without format validation.",
            "Validate email format before storing or using customer contact details.",
            build_refactored_fallback(
                "Email value is accepted without format validation.",
                "Add a validateEmail helper and reject invalid email input before creating the order.",
                language,
            ),
            ["email validation", "email format", "validateemail"],
        )

    if flags["weak_item_validation"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["item.price", "item.quantity", ".price", ".quantity"]),
            "medium",
            "bug",
            "Item validation relies on truthy checks instead of strict numeric validation.",
            "Check that price and quantity are finite positive numbers so zero, negative, missing, or string values are handled correctly.",
            build_refactored_fallback(
                "Item validation relies on truthy checks instead of strict numeric validation.",
                "Use typeof/Number.isFinite checks for price and quantity before calculation.",
                language,
            ),
            ["truthy", "numeric validation", "price and quantity", "finite positive"],
        )

    if flags["hardcoded_discount_rule"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["total >"]),
            "low",
            "best_practice",
            "Discount threshold or amount is hardcoded in business logic.",
            "Move discount limits and amounts into named constants or configuration.",
            build_refactored_fallback(
                "Discount threshold or amount is hardcoded in business logic.",
                "Use named constants such as DISCOUNT_LIMIT and DISCOUNT_AMOUNT.",
                language,
            ),
            ["hardcoded discount", "discount threshold", "discount amount"],
        )

    if flags["direct_object_mutation"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, [".status =", ".password =", ".role =", ".quantity =", ".price ="]),
            "medium",
            "code_quality",
            "Function mutates the input object directly.",
            "Return a new object instead of modifying the original input to reduce side effects.",
            build_refactored_fallback(
                "Function mutates the input object directly.",
                "Use object spreading or cloning before updating fields.",
                language,
            ),
            ["mutates", "mutation", "side effect", "new object"],
        )

    if flags["locale_date_formatting"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["toLocaleString", "toLocaleDateString"]),
            "low",
            "best_practice",
            "Locale-dependent date formatting is used in stored data.",
            "Use ISO timestamps for stored values and format dates only when displaying them.",
            build_refactored_fallback(
                "Locale-dependent date formatting is used in stored data.",
                "Use new Date().toISOString() for consistent stored timestamps.",
                language,
            ),
            ["locale date", "toLocaleString", "toLocaleDateString", "iso"],
        )

    if flags["magic_status_string"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["status"]),
            "low",
            "best_practice",
            "Order status is represented using repeated magic strings.",
            "Define shared status constants or an enum to avoid typos and inconsistent states.",
            build_refactored_fallback(
                "Order status is represented using repeated magic strings.",
                "Create an ORDER_STATUS constant and reuse it wherever statuses are assigned.",
                language,
            ),
            ["magic string", "order status", "status constant", "enum"],
        )

    if flags["clickable_non_button"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["onClick"]),
            "medium",
            "accessibility",
            "Clickable non-button element is not keyboard accessible.",
            "Use a button element for actions, or add proper role, tabIndex, and keyboard handlers.",
            build_refactored_fallback(
                "Clickable non-button element is not keyboard accessible.",
                "Replace clickable div/span/p elements with semantic buttons.",
                language,
            ),
            ["clickable", "keyboard accessible", "semantic button", "onclick"],
        )

    if flags["input_without_label"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["<input", "placeholder"]),
            "medium",
            "accessibility",
            "Form input relies on placeholder text instead of an accessible label.",
            "Add visible labels or aria-label/aria-labelledby so assistive technologies can identify fields.",
            build_refactored_fallback(
                "Form input relies on placeholder text instead of an accessible label.",
                "Add a label element or aria-label for every input.",
                language,
            ),
            ["placeholder", "accessible label", "aria-label", "input label"],
        )

    if flags["nested_quadratic_loop"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["for (", "for("]),
            "medium",
            "performance",
            "Nested loops can cause avoidable quadratic performance cost.",
            "Use a single pass, indexed lookup, or built-in sorting/filtering approach where possible.",
            build_refactored_fallback(
                "Nested loops can cause avoidable quadratic performance cost.",
                "Avoid nested iteration over the same collection for search/filter logic.",
                language,
            ),
            ["nested loop", "quadratic", "performance"],
        )

    if flags["repeated_string_concat"]:
        append_static_suggestion(
            suggestions,
            find_line_number(code, ["report", "invoice", "output"]),
            "low",
            "performance",
            "Repeated string concatenation in loops can be inefficient and harder to maintain.",
            "Build an array of lines and join them, or use a formatter/template helper.",
            build_refactored_fallback(
                "Repeated string concatenation in loops can be inefficient and harder to maintain.",
                "Collect output lines in an array and join them once.",
                language,
            ),
            ["string concatenation", "join", "report", "invoice"],
        )

    return suggestions[:MAX_SUGGESTIONS]


def calculate_score(
    suggestions: List[Dict[str, Any]],
    code: str,
    language: str,
    ai_score: Any = None,
) -> int:
    """Hybrid issue-based score.

    The final score is based on actual detected issues, their severity/category,
    and generic language-neutral static risk caps. It avoids sample-specific
    scoring so it works more consistently across JavaScript, Python, Java,
    React, Node.js, Spring Boot, C/C++, C#, and other languages.
    """

    if not isinstance(code, str) or not code.strip():
        return 0

    if not isinstance(suggestions, list):
        suggestions = []

    flags = detect_static_risk_flags(code)
    score = 100

    high_count = 0
    medium_count = 0
    low_count = 0
    security_high_count = 0

    for item in suggestions[:MAX_SUGGESTIONS]:
        severity = item.get("severity", "medium")
        category = item.get("category", "code_quality")
        issue_text = f"{item.get('issue', '')} {item.get('suggestion', '')}".lower()

        if severity == "high":
            high_count += 1

            if category == "security":
                security_high_count += 1
                score -= 30
            elif category == "bug":
                score -= 25
            elif category == "performance":
                score -= 22
            else:
                score -= 20

        elif severity == "medium":
            medium_count += 1

            if category == "security":
                score -= 16
            elif category in {"bug", "performance", "accessibility"}:
                score -= 12
            else:
                score -= 9

        else:
            low_count += 1

            if category in {"accessibility", "performance"}:
                score -= 6
            else:
                score -= 5

        if any(
            keyword in issue_text
            for keyword in [
                "sql injection",
                "nosql injection",
                "command injection",
                "xss",
                "cross-site scripting",
                "hardcoded secret",
                "hardcoded password",
                "plaintext password",
                "unsafe deserialization",
                "eval",
                "exec",
                "authentication bypass",
                "authorization bypass",
                "path traversal",
                "arbitrary file",
                "remote code execution",
            ]
        ):
            score -= 8

    # Direct static penalties catch risks even when the model under-reports them.
    if flags["unsafe_eval_exec"]:
        score -= 28

    if flags["sql_injection"]:
        score -= 35

    if flags["hardcoded_secret"]:
        score -= 22

    if flags["xss_risk"]:
        score -= 24

    if flags["command_execution"]:
        score -= 30

    if flags["unsafe_file_operation"]:
        score -= 24

    if flags["unsafe_deserialization"]:
        score -= 30

    if flags["plaintext_password_query"]:
        score -= 24

    if flags["broad_exception_swallow"]:
        score -= 10

    if flags["off_by_one_index_loop"]:
        score -= 18

    if flags["react_missing_effect_dependencies"]:
        score -= 10

    if flags["local_storage_token"]:
        score -= 8

    if flags["unsafe_error_leak"]:
        score -= 8

    if flags["weak_crypto"]:
        score -= 10

    if flags["hardcoded_localhost"]:
        score -= 3

    if flags["manual_resource_close"]:
        score -= 3

    if flags["missing_email_validation"]:
        score -= 8

    if flags["weak_item_validation"]:
        score -= 10

    if flags["hardcoded_discount_rule"]:
        score -= 5

    if flags["direct_object_mutation"]:
        score -= 6

    if flags["locale_date_formatting"]:
        score -= 3

    if flags["magic_status_string"]:
        score -= 4

    if flags["clickable_non_button"]:
        score -= 12

    if flags["input_without_label"]:
        score -= 10

    if flags["nested_quadratic_loop"]:
        score -= 14

    if flags["repeated_string_concat"]:
        score -= 6

    # Severity-based caps keep risky code from getting an inflated score.
    if security_high_count >= 3:
        score = min(score, 30)
    elif security_high_count == 2:
        score = min(score, 45)
    elif security_high_count == 1:
        score = min(score, 70)

    if high_count >= 4:
        score = min(score, 45)
    elif high_count == 3:
        score = min(score, 55)
    elif high_count == 2:
        score = min(score, 65)
    elif high_count == 1:
        score = min(score, 78)

    if medium_count >= 6:
       score = min(score, 62)
    elif medium_count >= 4:
       score = min(score, 68)
    elif medium_count >= 3:
       score = min(score, 72)
    elif medium_count >= 2:
       score = min(score, 76)
    elif medium_count == 1 and low_count >= 3:
       score = min(score, 80)

    severe_static_count = sum(
        1
        for key in [
            "unsafe_eval_exec",
            "sql_injection",
            "command_execution",
            "unsafe_file_operation",
            "unsafe_deserialization",
            "plaintext_password_query",
            "hardcoded_secret",
            "xss_risk",
        ]
        if flags[key]
    )

    if severe_static_count >= 4:
        score = min(score, 15)
    elif severe_static_count == 3:
        score = min(score, 25)
    elif severe_static_count == 2:
        score = min(score, 40)
    elif severe_static_count == 1:
        score = min(score, 70)

    quality_static_count = sum(
        1
        for key in [
            "missing_email_validation",
            "weak_item_validation",
            "hardcoded_discount_rule",
            "direct_object_mutation",
            "locale_date_formatting",
            "magic_status_string",
            "repeated_string_concat",
        ]
        if flags[key]
    )

    accessibility_static_count = sum(
        1 for key in ["clickable_non_button", "input_without_label"] if flags[key]
    )

    performance_static_count = sum(
        1 for key in ["nested_quadratic_loop", "repeated_string_concat"] if flags[key]
    )

    if quality_static_count >= 6:
        score = min(score, 64)
    elif quality_static_count >= 5:
        score = min(score, 68)
    elif quality_static_count >= 4:
        score = min(score, 72)
    elif quality_static_count >= 3:
        score = min(score, 78)

    if accessibility_static_count >= 2:
        score = min(score, 68)
    elif accessibility_static_count == 1:
        score = min(score, 78)

    if performance_static_count >= 2:
        score = min(score, 70)
    elif performance_static_count == 1 and flags["nested_quadratic_loop"]:
        score = min(score, 76)

    if flags["sql_injection"]:
        score = min(score, 45)

    if flags["unsafe_eval_exec"] or flags["command_execution"] or flags["unsafe_deserialization"]:
        score = min(score, 50)

    if flags["hardcoded_secret"]:
        score = min(score, 60)

    if flags["xss_risk"]:
        score = min(score, 65)

    if flags["unsafe_file_operation"]:
        score = min(score, 55)

    if flags["plaintext_password_query"]:
        score = min(score, 55)

    # If no issues are found, avoid blindly returning 100.
    # Very short snippets rarely prove production-grade quality.
    if not suggestions:
        non_empty_lines = [line for line in code.splitlines() if line.strip()]
        score = min(score, 88 if len(non_empty_lines) < 8 else 92)

    return max(0, min(100, round(score)))


def normalize_result(result: Dict[str, Any], language: str, code: str) -> Dict[str, Any]:
    suggestions = normalize_suggestions(result.get("suggestions"), language)
    suggestions = augment_static_suggestions(suggestions, code, language)

    # Final score is calculated from actual detected issues and generic static risks,
    # not from hardcoded sample-specific code patterns.
    score = calculate_score(suggestions, code, language, result.get("overallScore"))

    summary = clean_text(result.get("summary"), "Code review completed.")

    print(f"Hybrid final score ({SCORING_VERSION}): {score}")

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
                        "Use accurate severity labels based on real exploitability, runtime failure, maintainability impact, and accessibility impact. "
                        "Do not over-penalize clean code, but do not miss critical risks."
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

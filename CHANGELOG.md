# Changelog

All notable changes to **Meridian AI – AI Powered Code Review & Bug Suggestion System** are documented in this file.

The project follows a continuous improvement approach where features, bug fixes, enhancements, testing activities, and final-evaluation preparations are tracked throughout development.

---

## [1.0.0] - Initial Repository Release

### Project Overview

Meridian AI is an AI-powered code review platform that analyzes source code and provides bug detection, security analysis, code quality assessment, accessibility feedback, performance observations, and refactoring suggestions using Large Language Models.

### Note

The project was initially developed locally. After the core implementation was completed, the codebase was uploaded to GitHub and version control was used for subsequent bug fixes, improvements, validation, and maintenance activities.

### Added

* React frontend application.
* Node.js and Express backend.
* MongoDB database integration.
* Python FastAPI AI microservice.
* Environment configuration and project setup.

### Implemented Features

* User Authentication System.
* GitHub OAuth Login.
* JWT-based Authentication.
* Code Submission Interface.
* Multi-language Code Analysis.
* AI-powered Code Review Engine.
* Bug Detection and Reporting.
* Severity Classification.
* Refactoring Suggestions.
* Suggested Code Fixes.
* Review Dashboard.
* Review History Management.
* Review Sharing Functionality.
* Side-by-Side Code Comparison (Diff Viewer).

### AI Integration

* Groq API Integration.
* Llama 3.3 70B Versatile Model Integration.
* Structured JSON Response Handling.
* AI-generated Summaries and Recommendations.

---

## [1.0.1] - Stability Improvements

### Fixed

* Authentication-related issues.
* Backend API communication issues.
* Review result rendering inconsistencies.
* AI response parsing failures.

### Improved

* Error handling across frontend and backend.
* Loading states during code analysis.
* Response validation mechanisms.
* Application stability and reliability.

---

## [1.0.2] - User Interface Enhancements

### Improved

* Dashboard responsiveness.
* Review result presentation.
* Issue categorization display.
* Navigation experience.

### Fixed

* Layout inconsistencies.
* Review page rendering issues.
* Component alignment problems.

---

## [1.0.3] - Diff Viewer Enhancements

### Added

* Improved original versus suggested-code comparison.
* Better code readability in review results.

### Fixed

* Text overflow issues.
* Code wrapping issues.
* Diff Viewer alignment issues.
* Suggested-code display formatting problems.

---

## [1.0.4] - AI Review Accuracy Improvements

### Added

* Deterministic scoring support for more consistent review scores.
* Fixed penalty-based score calculation for high, medium, and low severity issues.
* Category-based scoring penalties for security, bug, accessibility, performance, UI/UX, and code-quality issues.
* Baseline AI context files for improving review reliability.
* OWASP-based security rules.
* Accessibility review rules.
* General code-quality review rules.
* GIGW-related guideline support.
* Prompt-injection protection instructions for AI review requests.
* AI response normalization for severity and category values.

### Improved

* Review-score consistency for repeated analysis of the same code.
* AI response validation before saving review results.
* Handling of missing or incomplete AI response fields.
* Security issue detection accuracy.
* Accessibility issue detection support.
* Reduction of hallucinated AI suggestions using predefined rule files.
* Backend review-processing logic.
* AI-service stability and reliability.

### Fixed

* Score fluctuation where the same code received substantially different scores across repeated reviews.
* Missing severity and category fallback issues.
* Inconsistent AI-generated score handling.
* AI response parsing edge cases.

---

## [1.0.5] - Profile Dashboard Update

### Added

* Profile Dashboard page.
* User profile overview section.
* Avatar and profile-image display.
* Username and email display.
* About and bio section.
* Account-type display.
* GitHub synchronization status.
* GitHub username display.
* Member-since date display.
* Edit Profile option.
* New Review button for quick navigation.
* User review-statistics section.
* Total reviews summary card.
* Average score summary card.
* Best score summary card.
* Top programming language summary card.
* Review-quality insights.
* Issue-severity overview.
* Review-performance summary.
* Additional dashboard analytics for score quality, review performance, source usage, and programming-language usage.

### Improved

* User dashboard experience.
* Navigation between Profile, Review, and History pages.
* Visibility of user review activity.
* Review analytics presentation.
* Authenticated user interface.
* Profile-edit functionality.
* Dashboard analytics accuracy and presentation.

---

## [1.0.6] - GitHub and Review Workflow Enhancements

### Added

* GitHub repository loading support.
* GitHub folder and file browsing support.
* GitHub file decoding and loading into the code editor.
* GitHub source-tracking support using source type.
* File-path validation for GitHub-loaded code.
* File-size validation before loading GitHub files.
* Code-title input for reviews.
* Code-paste support.
* Code-upload support.
* Upload and Clear controls.
* Automatic programming-language detection badge.
* Line-count and character-count display.
* Review and Diff tabs.
* Refactored-code display from AI responses.

### Improved

* GitHub code-review workflow.
* Code-submission experience.
* Review-page usability.
* Review-result organization.
* Source handling for pasted, uploaded, and GitHub-loaded code.
* GitHub OAuth session handling.
* GitHub account switching and authentication flow.

### Fixed

* GitHub OAuth session persistence issue during local development.
* GitHub file-loading reliability issues.
* Code-editor reset and clear handling.
* Minor review-page workflow issues.

---

## [1.0.7] - Review History and Sharing Enhancements

### Added

* Search support in Review History.
* Score-based review filtering.
* Review cards for saved reviews.
* Selected-review detail view.
* Delete Review option.
* Share Review option.
* Shareable-review token support.
* Public-sharing flag support.
* Public Shared Review page.
* Token-based public-review access.
* Review-ownership handling.
* MongoDB-backed review-persistence improvements.

### Improved

* Review-history management.
* Saved-review navigation.
* Review-detail presentation.
* Review-sharing workflow.
* Public-review sharing flow.
* User-specific review storage and access.
* Review-history functionality and performance.

### Fixed

* Review-history rendering issues.
* Review-delete handling issues.
* Review-data display inconsistencies.
* Public Shared Review access issues.
* Public-review sharing verification issues.

---

## [1.0.8] - Validation and Security Enhancements

### Added

* Client-side logout flow that removes the stored JWT and redirects the user to Login.
* Protected-route cleanup after client-side logout.
* Improved validation for review requests.
* Improved validation for uploaded code.
* Improved validation for GitHub-loaded code.
* Enhanced error handling across frontend, backend, and AI service.
* Final verification support for public-review sharing.
* Improved profile-edit functionality.
* Additional dashboard analytics.

### Improved

* Application security.
* Authentication and logout reliability.
* File-upload safety.
* Backend validation mechanisms.
* Frontend error display.
* Backend error-response consistency.
* Public-sharing reliability.
* Profile-management experience.
* Dashboard analytics and user insights.
* Overall application stability before final evaluation.

### Fixed

* Client-side logout and protected-route redirection issues.
* Local authentication-state cleanup issues.
* Misleading logout documentation and endpoint references.
* Validation and error-handling issues.
* Public-review sharing-flow issues.
* Profile-editing issues.
* Dashboard analytics limitations.
* Minor frontend rendering issues.

---

## [1.0.9] - Source Tracking, Validation, and Consistency Fixes

### Added

* Accurate source tracking for pasted, uploaded, and GitHub-loaded reviews.
* Dedicated storage of uploaded source filenames.
* Dedicated storage of GitHub repository and file-path metadata.
* Supported-extension checks for uploaded and GitHub-loaded files.
* 1 MB client-side uploaded-file size validation.
* Backend validation for source type and associated source metadata.
* Language detection for Kotlin, HTML, and CSS.
* Detection support for 12 programming and markup language families.
* Shared review-quality classification utility.
* Shared frontend review-source validation utility.
* Shared backend review-source validation utility.
* Dependency-free frontend utility tests.
* Dependency-free backend source-validation tests.

### Improved

* Review-source presentation in Review History.
* Review-source analytics in the Profile Dashboard.
* Language detection for similar languages and file types.
* HTML and JSX differentiation.
* Java and Kotlin differentiation.
* C and C++ differentiation.
* JavaScript and TypeScript differentiation.
* Upload validation feedback.
* GitHub-file validation feedback.
* Review quality consistency across frontend screens.
* Home-page feature and supported-language descriptions.
* README API-route accuracy.
* README logout-flow accuracy.
* Changelog implementation accuracy.

### Fixed

* Uploaded and GitHub-loaded reviews being incorrectly stored as pasted reviews.
* Missing uploaded-filename metadata in new review records.
* Missing GitHub repository metadata in new review records.
* Missing GitHub full-file-path metadata in new review records.
* Incorrect Profile Dashboard source statistics caused by inaccurate stored source types.
* Inconsistent Good, Fair, and Poor thresholds across Review, History, Profile, Review Panel, and Shared Review screens.
* Good, Fair, and Poor thresholds are now consistently:

  * Good: 80–100
  * Fair: 50–79
  * Poor: 0–49

* HTML source being identified as JSX solely because it contained HTML tags.
* Unsupported uploaded and GitHub file types reaching the analysis workflow.
* Code above 500 lines being silently truncated before analysis.
* README API routes not matching the actual backend implementation.
* Logout documentation describing backend behaviour that was not implemented.

### Validation

* Frontend review-quality boundary tests added.
* Frontend supported-extension tests added.
* Frontend upload-size validation tests added.
* Frontend language-detection tests added.
* Backend source-type validation tests added.
* Backend uploaded-filename validation tests added.
* Backend GitHub repository and file-path validation tests added.
* Existing AI-service implementation kept unchanged.

---

## [1.0.10] - Final Evaluation Readiness and History UI Polish

### Added

* Bold and visually prominent Share button on Review History cards.
* Bold and visually prominent Delete button on Review History cards.
* Clear Share and Delete button borders, backgrounds, icons, and hover states.
* Accessible labels for Review History action buttons.
* Improved source-information display for pasted, uploaded, and GitHub-loaded reviews.
* Final-evaluation preparation status section.
* Historical Mid Evaluation status labelling.
* Final local, regression, responsive, and deployment verification checklist.
* Final documentation and project-report preparation tracking.

### Improved

* Share-action visibility in both light and dark themes.
* Delete-action visibility in both light and dark themes.
* Review History usability and visual hierarchy.
* Review-source presentation across History and Profile.
* Score-quality consistency across Review, History, Profile, and Shared Review.
* Code-upload validation.
* GitHub-file validation.
* Multi-language detection reliability.
* User feedback when uploaded files are unsupported.
* User feedback when code exceeds the 500-line review limit.
* README and changelog accuracy.
* Final demonstration and evaluation readiness.

### Fixed

* Share and Delete actions appearing faint or visually similar to disabled controls.
* Weak contrast of Review History action buttons.
* Review History action buttons lacking sufficient visual emphasis.
* Outdated project-status wording that still described the application as being at the Mid Evaluation stage.
* Current-development wording that did not reflect final-evaluation preparation.

### Validation Status

* Updated source files applied to the final repository.
* Frontend utility tests completed successfully: 5/5 passed.
* Backend source-validation tests completed successfully: 4/4 passed.
* Frontend production build completed successfully.
* Backend JavaScript syntax checks completed successfully.
* AI-service Python compilation completed successfully.
* Final local regression testing pending.
* Final deployed-application verification pending.
* Final responsive-layout verification pending.
* Final screenshot and test-evidence collection pending.

---

## Final Evaluation Preparation Status

### Completed Development Modules

* Requirement Analysis.
* System Design.
* Architecture Planning.
* React and Vite Frontend.
* Node.js and Express Backend.
* MongoDB and Mongoose Integration.
* Python FastAPI AI Microservice.
* Groq API Integration.
* Llama 3.3 70B Versatile Integration.
* Registration with Email Verification.
* Confirm Password Validation.
* Username or Email Login.
* Login Email-Code Verification.
* GitHub OAuth Login.
* JWT Authentication.
* Protected Frontend Routes.
* Client-side Logout.
* Forgot Password.
* Reset Password.
* Profile Dashboard.
* Profile Editing.
* Avatar Selection.
* GitHub Avatar Support.
* Account and Review Analytics.
* Code Paste Input.
* Code File Upload.
* GitHub Repository Browsing.
* GitHub File Loading.
* Review Source Tracking.
* Uploaded-Filename Storage.
* GitHub Repository Metadata Storage.
* GitHub File-Path Storage.
* Automatic Programming-Language Detection.
* Line and Character Counts.
* 500-Line Review Limit.
* AI Review Request Pipeline.
* AI-generated Review Summary.
* Overall Code-Quality Score.
* High, Medium, and Low Severity Classification.
* Issue Category Classification.
* Security Analysis.
* Accessibility Analysis.
* Performance Analysis.
* Code-Quality Analysis.
* UI/UX Analysis.
* Best-Practice Analysis.
* Bug Detection.
* Refactoring Suggestions.
* Suggested Corrected Code.
* Hybrid Issue-based Scoring.
* OWASP Rule Context.
* GIGW Accessibility Rule Context.
* Code-Quality Rule Context.
* Review-Output Rule Context.
* Prompt-Injection Resistance Instructions.
* AI Response Cleaning and Normalization.
* Review and Diff Views.
* Review History Storage.
* Review History Search.
* Good, Fair, and Poor Filters.
* Review Details.
* Review Deletion.
* Review Sharing.
* Public Shared Review Page.
* Profile Review-Source Analytics.
* Light and Dark Themes.
* Responsive Frontend Layout.
* Netlify Frontend Deployment.
* Render Backend Deployment.
* Render AI-Service Deployment.
* MongoDB Atlas Database Deployment.
* Brevo Transactional Email Integration.
* Production GitHub OAuth Configuration.
* Production Frontend, Backend, and AI-Service Communication.
* README Documentation.
* Deployment Documentation.
* Team Contribution Documentation.
* Final Project Report Resource Collection.

### Current Verification Status

* No known blocking issue has been identified in the corrected source files.
* Final local build and regression verification are required after applying the updated files.
* Final production redeployment and live testing are required before marking the release fully verified.
* Existing reviews created before the source-tracking correction may continue to appear as pasted reviews because their original source metadata was not stored.
* New reviews created after deployment will store accurate Paste, Upload, and GitHub source information.
* Final screenshots and formal test-result evidence are still being prepared.
* The final Word and PDF project reports are in preparation.

### Final Verification Tasks

* Apply all final updated files to the dedicated Git branch.
* Frontend utility tests completed successfully — 5/5 passed.
* Frontend production build completed successfully.
* Backend source-validation tests completed successfully — 4/4 passed.
* Run backend syntax checks.
* Verify AI-service Python compilation.
* Run the complete application locally.
* Test registration and registration verification.
* Test username and email login.
* Test login-code verification.
* Test GitHub OAuth login.
* Test logout and protected-route redirection.
* Test forgot-password and reset-password workflows.
* Test profile viewing and editing.
* Test pasted-code review.
* Test uploaded-file review.
* Test GitHub-loaded code review.
* Verify Review History source labels.
* Verify Profile Dashboard source statistics.
* Verify Good, Fair, and Poor classifications.
* Verify Review and Diff tabs.
* Verify History search and filters.
* Verify review deletion.
* Verify public-review sharing in a private or incognito browser.
* Verify unsupported-file rejection.
* Verify the 1 MB upload limit.
* Verify the 500-line review limit.
* Verify all supported language families.
* Verify light and dark themes.
* Verify desktop, tablet, and mobile responsiveness.
* Redeploy the backend to Render.
* Redeploy the frontend to Netlify.
* Test the production backend health endpoint.
* Test the production AI-service health endpoint.
* Test the complete deployed user workflow.
* Capture final report screenshots.
* Complete the formal test-case and test-result document.
* Complete the final Word project report.
* Generate the final PDF project report.
* Prepare the final demonstration.
* Prepare team members for viva questions.

---

## Technology Stack

### Frontend

* React.js.
* Vite.
* JavaScript.
* JSX.
* HTML5.
* CSS3.
* Tailwind CSS.
* React Router.
* Axios.

### Backend

* Node.js.
* Express.js.
* MongoDB.
* MongoDB Atlas.
* Mongoose.
* JSON Web Token Authentication.
* Passport.js.
* GitHub OAuth 2.0.
* Brevo Transactional Email API.

### AI Microservice

* Python.
* FastAPI.
* Groq API.
* Llama 3.3 70B Versatile.
* Hybrid Issue-based Scoring.
* Baseline Rule Files.
* Structured AI Prompting.
* AI Response Validation and Normalization.

### Deployment

* Netlify for the React and Vite frontend.
* Render for the Node.js and Express backend.
* Render for the Python FastAPI AI service.
* MongoDB Atlas for cloud database storage.
* Brevo for transactional email delivery.
* Groq for LLM inference.
* GitHub for source-code hosting and deployment integration.

### Development and Testing Tools

* Git.
* GitHub.
* GitHub Desktop.
* Postman.
* Visual Studio Code.
* MongoDB Compass.
* Browser Developer Tools.
* Node.js Built-in Test Runner.
* Python Compilation Checks.

---

## Historical Project Status Snapshot — Mid Evaluation

The following table is retained as a historical record of the project status during the Mid Evaluation stage.

| Module                      | Completion |
| --------------------------- | ---------- |
| Requirement Analysis        | 100%       |
| System Design               | 100%       |
| Frontend Development        | 98%        |
| Backend Development         | 98%        |
| Authentication              | 100%       |
| Client-side Logout          | 100%       |
| GitHub OAuth                | 98%        |
| AI Integration              | 100%       |
| Code Analysis Engine        | 98%        |
| Hybrid Scoring              | 100%       |
| AI Rule Context Integration | 95%        |
| Review Dashboard            | 95%        |
| Profile Dashboard           | 98%        |
| Profile Editing             | 95%        |
| Review History              | 98%        |
| Review Sharing              | 98%        |
| Server-side Validation      | 98%        |
| Testing and Optimization    | 90%        |

**Historical Overall Project Completion at Mid Evaluation: approximately 97%**

---

## Project Status — Final Evaluation Preparation

| Module                              | Status                          |
| ----------------------------------- | ------------------------------- |
| Requirement Analysis                | Completed                       |
| System Design                       | Completed                       |
| Frontend Development                | Completed                       |
| Backend Development                 | Completed                       |
| Database Integration                | Completed                       |
| Authentication                      | Completed                       |
| Email Verification                  | Completed                       |
| Password Reset                      | Completed                       |
| GitHub OAuth                        | Completed                       |
| AI Integration                      | Completed                       |
| Hybrid Code Review and Scoring      | Completed                       |
| AI Rule Context Integration         | Completed                       |
| Code Paste Input                    | Completed                       |
| File Upload                         | Completed                       |
| GitHub Code Loading                 | Completed                       |
| Code Input Source Tracking          | Corrected; final retest pending |
| Language Detection                  | Corrected; final retest pending |
| Review Dashboard                    | Completed                       |
| Diff Viewer                         | Completed                       |
| Profile Dashboard                   | Completed                       |
| Profile Editing                     | Completed                       |
| Review History                      | Updated; final retest pending   |
| Review Sharing                      | Completed; final retest pending |
| Public Shared Review                | Completed; final retest pending |
| Validation and Error Handling       | Updated; final retest pending   |
| History Action-Button UI            | Updated; final retest pending   |
| Light and Dark Themes               | Completed                       |
| Responsive UI                       | Final verification pending      |
| Frontend Automated Utility Tests    | Passed — 5/5                    |
| Backend Source Validation Tests     | Passed — 4/4                    |
| Frontend Production Build           | Passed                          |
| Local Regression Testing            | Pending                         |
| Production Deployment Verification  | Pending                         |
| Formal Test Documentation           | In progress                     |
| Final Screenshot Collection         | Pending                         |
| Final Project Report                | In progress                     |
| Final Demonstration Preparation     | In progress                     |
| Viva Preparation                    | Pending                         |

**Development Status: Completed**

**Final Verification Status: In Progress**

**Current Stage: Final Evaluation Preparation, Testing, Documentation, and Deployment Verification**

---

## Release Readiness Note

The Meridian AI application contains the planned core frontend, backend, database, authentication, AI-review, GitHub-integration, history, profile, sharing, and deployment functionality.

The project will be marked **Ready for Final Evaluation** after:

* All final updated files are applied to the main repository.
* Automated tests pass.
* The frontend production build succeeds.
* Local regression testing is completed.
* Updated backend and frontend services are deployed.
* The live application is verified.
* Responsive testing is completed.
* Formal test evidence and screenshots are collected.
* The final Word and PDF reports are completed.

After these tasks are completed, the final status may be updated to:

**Development Status: Completed**

**Final Verification Status: Completed**

**Project Status: Ready for Final Evaluation**
# API Key & Secrets Management Guide for NEWEVENTS

## Introduction

API keys, tokens, and other secrets are critical credentials that grant access to third-party services and internal resources. Proper management of these secrets is paramount to the security and integrity of the NEWEVENTS project.

*   **Importance of Secure API Key Management:** Compromised API keys can lead to unauthorized data access, service disruption, financial loss, and reputational damage.
*   **Risks Associated with Poor Management:**
    *   Accidental exposure in public code repositories.
    *   Hardcoding secrets in client-side applications.
    *   Insufficient access controls or overly permissive keys.
    *   Lack of rotation or monitoring.

## Principles of Secure API Key & Secrets Management

The following principles should guide our approach to managing secrets:

*   **Least Privilege:** API keys should be configured with the minimum set of permissions necessary for their intended function. Avoid using master keys or keys with overly broad scopes unless absolutely required and appropriately secured.
*   **Regular Rotation:** Periodically change API keys and other secrets according to a defined schedule or when a potential compromise is suspected.
*   **Secure Storage:** Never hardcode secrets directly into source code. Utilize secure storage mechanisms like environment variables or dedicated secrets management services.
*   **Restricted Access:** Limit access to secrets to only authorized personnel and services that require them.
*   **Monitoring & Auditing:** Track API key usage to detect suspicious activity or anomalies. Maintain audit logs for access to secrets management systems.
*   **Separation of Environments:** Use different API keys for different environments (e.g., development, staging, production).

## Recommended Storage Mechanisms

### 1. Environment Variables

Environment variables are a common and effective way to manage secrets, especially for server-side applications and during local development.

*   **Local Development:**
    *   Use `.env` files (e.g., `.env.local`) to store secrets for local development.
    *   **Crucially, ensure these `.env` files are listed in the project's `.gitignore` file to prevent them from being committed to the code repository.**
*   **Deployment Environments (Vercel, Netlify, Docker, etc.):**
    *   Most hosting platforms and container orchestration systems provide secure mechanisms for setting environment variables for deployed applications.
    *   Consult the specific platform's documentation for best practices (e.g., Vercel Environment Variables UI, Netlify Build environment variables).
*   **Security Considerations:**
    *   While environment variables are not stored in code, ensure the underlying system or platform where they are set is secure.
    *   Be mindful of processes or logs that might inadvertently expose environment variables.

### 2. Secrets Management Services

For more robust and centralized secrets management, especially in complex or production environments, consider using dedicated services:

*   **Examples:**
    *   **HashiCorp Vault:** A popular open-source tool for secrets management.
    *   **AWS Secrets Manager:** A managed service from Amazon Web Services.
    *   **Google Cloud Secret Manager:** A managed service from Google Cloud Platform.
    *   **Azure Key Vault:** A managed service from Microsoft Azure.
    *   Platform-specific solutions like Vercel's sensitive environment variables.
*   **Benefits:**
    *   **Centralization:** Store all secrets in one secure, auditable location.
    *   **Fine-Grained Access Control:** Define precise permissions for who or what can access specific secrets.
    *   **Audit Logs:** Track every access and modification to secrets.
    *   **Automated Rotation (often supported):** Some services can help automate the process of rotating secrets.
*   **Basic Setup and Usage:**
    *   Typically involves configuring the application to fetch secrets from the service at startup or runtime.
    *   Requires secure authentication of the application to the secrets management service.

## Access Control for API Keys

Where supported by the API provider, enhance security by restricting how API keys can be used:

*   **IP Address Whitelisting/Restrictions:** Allow API calls only from specific IP addresses or ranges.
*   **HTTP Referrer Restrictions:** For client-side keys, restrict usage to specific domain names.
*   **API Scopes/Permissions:** As mentioned under "Least Privilege," ensure the key is limited to only the necessary API endpoints or actions.

## API Key Usage in Code

*   **Server-Side:**
    *   Load secrets from environment variables or a secrets manager when the application starts or on demand.
    *   Pass them securely to the relevant API client modules.
*   **Client-Side (Browser):**
    *   **Avoid embedding secret API keys directly in client-side JavaScript.** This makes them publicly visible.
    *   If an API requires client-side calls with a key, use "publishable" keys if the provider offers them (these typically have very limited permissions).
    *   For operations requiring secret keys, the preferred pattern is to have the client make a request to your own backend (e.g., a Next.js API route), which then securely makes the call to the third-party API using the secret key stored server-side.

## API Key Rotation Policy

*   **Recommended Frequency:**
    *   Establish a regular rotation schedule (e.g., every 90 days, 6 months, or annually, depending on sensitivity and provider recommendations).
    *   Rotate keys immediately if a compromise is suspected or if an employee with access leaves the project.
*   **Procedure for Rotation:**
    *   Generate a new key in the API provider's dashboard.
    *   Update the key in your secure storage (environment variables, secrets manager).
    *   Deploy the application with the new key.
    *   Verify the new key is working correctly.
    *   Deactivate or delete the old key from the API provider's dashboard.
    *   Plan rotations to minimize service disruption (e.g., some services allow multiple active keys during a transition period).

## Auditing and Monitoring

*   **Monitor API Usage:** Regularly review API usage logs provided by the third-party service for unusual patterns, high request volumes, or calls from unexpected locations.
*   **Secrets Manager Logs:** If using a secrets management service, review its audit logs for unauthorized access attempts.
*   **Incident Response:** Have a plan in place for what to do if an API key is compromised:
    *   Immediately revoke or rotate the compromised key.
    *   Assess the potential impact.
    *   Investigate the cause of the compromise.
    *   Notify relevant stakeholders if necessary.

## Responsibilities

*   **Technical Lead / DevOps:** Typically responsible for establishing secrets management policies, configuring secrets management tools, and overseeing key rotation.
*   **Developers:** Responsible for adhering to secure coding practices, using secrets correctly as per guidelines, and not exposing secrets.

By following these guidelines, the NEWEVENTS project can significantly reduce the risk associated with managing API keys and other sensitive secrets.
# Security Policy 🔒

## Supported Versions

Currently supported versions of DoNest with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| 0.0.x   | :x:                |

## Reporting a Vulnerability 🛡️

We take the security of DoNest seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Reporting Process

1. **Do Not** disclose the vulnerability publicly until it has been addressed.
2. Email your findings to [INSERT-EMAIL]. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any possible solutions you can suggest

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Timeline**: Typically within 30 days

## Security Best Practices 🔐

### For Users

1. **Keep VS Code Updated**

   - Always use the latest version of Visual Studio Code
   - Keep the DoNest extension updated

2. **Workspace Security**

   - Be cautious when opening tasks in untrusted workspaces
   - Review task content before executing associated actions

3. **File Access**
   - Only allow DoNest to access necessary workspace folders
   - Review file paths when creating tasks

### For Contributors

1. **Code Review**

   - All changes must go through security review
   - Follow secure coding practices
   - Use approved VS Code APIs

2. **Dependencies**

   - Keep dependencies up to date
   - Use only trusted and verified packages
   - Regular security audits using `npm audit`

3. **Data Handling**
   - Minimize data storage
   - Use VS Code's secure storage APIs
   - Properly sanitize user inputs

## Security Features 🛡️

DoNest implements several security measures:

1. **Data Storage**

   - Uses VS Code's built-in secure storage
   - No external data transmission
   - Local workspace scope only

2. **File Access**

   - Restricted to workspace boundaries
   - Respects VS Code's file system permissions
   - No arbitrary file system access

3. **Input Validation**
   - Sanitization of user inputs
   - Path validation for file operations
   - Safe task content handling

## Version Control Security 🔒

1. **Branch Protection**

   - Main branch requires review
   - Signed commits required
   - CI/CD checks mandatory

2. **Release Process**
   - Version verification
   - Security scan before release
   - Changelog review

## Vulnerability Management 📋

### Severity Levels

| Level    | Description               | Response Time |
| -------- | ------------------------- | ------------- |
| Critical | Immediate security risk   | 24 hours      |
| High     | Significant vulnerability | 48 hours      |
| Medium   | Limited security impact   | 1 week        |
| Low      | Minimal security risk     | 2 weeks       |

### Resolution Process

1. **Assessment**

   - Verify report
   - Determine severity
   - Plan mitigation

2. **Resolution**

   - Develop fix
   - Test solution
   - Security review

3. **Deployment**
   - Release update
   - Update documentation
   - Notify users if necessary

## Contact 📬

For security concerns, contact:

- GitHub Security Tab: [Security Issues](https://github.com/oussamabenalisst/DoNest/security)

## Acknowledgments 🙏

We appreciate the security research community's efforts in helping keep DoNest secure. Contributors who report valid security issues will be acknowledged in our Hall of Fame (unless they prefer to remain anonymous).

---

Last Updated: July 15, 2025

package security

# OPA policy for security validation

# Check for hardcoded secrets
hardcoded_secrets[file] {
    file := input.files[_]
    file.content =~ "password\\s*=\\s*['\"][^'\"]+['\"]"
}

hardcoded_secrets[file] {
    file := input.files[_]
    file.content =~ "api[_-]?key\\s*=\\s*['\"][^'\"]+['\"]"
}

# Check for missing input validation
missing_validation[file] {
    file := input.files[_]
    file.path =~ ".*\\.controller\\.ts$"
    not file.content =~ "@Body\\(\\)\\s+\\w+:\\s+\\w+Dto"
}

# Check for missing error handling
missing_error_handling[file] {
    file := input.files[_]
    file.path =~ ".*\\.service\\.ts$"
    file.content =~ "async\\s+\\w+\\("
    not file.content =~ "try\\s*\\{"
}

# Check for missing logger
missing_logger[file] {
    file := input.files[_]
    file.path =~ ".*\\.service\\.ts$"
    file.content =~ "@Injectable\\(\\)"
    not file.content =~ "Logger"
}

# Overall security check
violations[msg] {
    count(hardcoded_secrets) > 0
    msg := sprintf("Found %d files with hardcoded secrets", [count(hardcoded_secrets)])
}

violations[msg] {
    count(missing_validation) > 0
    msg := sprintf("Found %d controllers missing input validation", [count(missing_validation)])
}

violations[msg] {
    count(missing_error_handling) > 0
    msg := sprintf("Found %d services missing error handling", [count(missing_error_handling)])
}

violations[msg] {
    count(missing_logger) > 0
    msg := sprintf("Found %d services missing Logger", [count(missing_logger)])
}


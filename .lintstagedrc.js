module.exports = {
  '*.ts': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
    'bash scripts/run-semgrep.sh',
  ],
  '*.{json,md}': ['prettier --write'],
};


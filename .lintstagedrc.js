module.exports = {
  '*.ts': [
    'eslint --fix',
    'prettier --write',
    'jest --findRelatedTests --passWithNoTests',
  ],
  '*.{json,md}': ['prettier --write'],
};


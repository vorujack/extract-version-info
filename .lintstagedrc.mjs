
let tasks = {
};

if (!process.env.CI) {
  tasks = {
    '*.ts': () => 'npm run type-check',
        ...tasks,
  };
}

export default tasks;

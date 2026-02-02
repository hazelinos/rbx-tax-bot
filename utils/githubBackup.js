const simpleGit = require('simple-git');

const git = simpleGit();

module.exports = async function backup() {
  try {
    await git.add('./data/leaderboard.json');
    await git.commit('Auto backup leaderboard');
    await git.push();
    console.log('✅ Backup GitHub success');
  } catch {
    console.log('skip backup');
  }
};
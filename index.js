const { exec } = require("child_process");

function run(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`▶ Running: ${cmd}`);
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Error when running: ${cmd}\n`, err);
        return reject(err);
      }
      console.log(stdout);
      resolve();
    });
  });
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function main() {
  await run("node src/rabbit_mq/send.js");
  await delay(2000); // ⏳ 2s

  await run("node src/rabbit_mq/receive.js");
  await delay(2000);

  await run("node src/data_quality/pipeline.js");

  console.log("🎉 All tasks completed");
}

main();

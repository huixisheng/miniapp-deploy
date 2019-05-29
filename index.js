#!/usr/bin/env node
const inquirer = require('inquirer');
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const ora = require('ora');
const merge = require('merge');
// const notifier = require('node-notifier');

const appPath = process.cwd();
const filename = 'deploy.config.js';
let appsConfig = [];
const filepath = path.join(appPath, filename);
const pkg = require(path.join(appPath, 'package.json'));

if (fs.existsSync(filepath)) {
  appsConfig = require(filepath);
} else {
  console.error(filename, '配置文件文件不存在');
  shell.exit(1);
}
shell.config.silent = false;
let appid = '';
let needBuild = true;
// const appPlatform = process.env.APP_FLATFORM;
// notifier.notify('Message');

main();

async function main() {
  if (appsConfig.length === 1) {
    appid = appsConfig[0]['value'];
    needBuild = true;
  } else {
    const { action } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: '选择要发布的小程序名称',
        choices: appsConfig,
      }
    ]);
    appid = action;
    const { ok } = await inquirer.prompt([
      {
        name: 'ok',
        type: 'confirm',
        message: `是否运行构建命令 npm run build`
      }
    ]);
    needBuild = ok;
  }

  // needBuild = false;

  const spinner = ora('正在发布小程序...').start();
  if (needBuild) {
    spinner.text = '正在构建，构建需要一点时间，请耐心等待...'
    // console.log('正在构建...');
    const runRes = await runCommand('npm run build');
    if (!runRes) {
      shell.exit(1);
    }
    spinner.succeed('构建完成');
  } 
  // spinner.stop();
  spinner.start('正在上传...');
  renameProjectConfigName();
  wxUpload(spinner);
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    shell.exec(command, function (code, stdout, stderr) {
      if (code !== 0) {
        shell.echo(`${command}生成失败`);
        reject(false)
        // shell.exit(1);
      }
      resolve(true);
    });
  })
}

function renameProjectConfigName() {
  const projectJson = path.join(appPath, 'project.config.json');
  const projectConfig = require(projectJson);
  projectConfig.projectname = appid + pkg.name;
  projectConfig.appid = appid;
  projectConfig.miniprogramRoot = './';

  let distProject = path.join(appPath, 'dist/project.config.json');
  const taroConfigPath = path.join(appPath, 'config/index.js');
  if (fs.existsSync(taroConfigPath)) {
    const taroConfig = require(taroConfigPath)(merge);

    distProject = path.join(appPath, taroConfig.outputRoot, 'project.config.json');
  }
  console.log('distProject', distProject);

  fs.writeFileSync(distProject, JSON.stringify(projectConfig, null, 2));
}

function wxUpload(spinner) {
  // TODO: 取config配置
  const taroConfigPath = path.join(appPath, 'config/index.js');
  let uploadProject = path.join(appPath, 'dist');
  if (fs.existsSync(taroConfigPath)) {
    const taroConfig = require(taroConfigPath)(merge);
    uploadProject = path.join(appPath, taroConfig.outputRoot);
  }

  console.log('uploadProject', uploadProject);

  const bin = '/Applications/wechatwebdevtools.app/Contents/Resources/app.nw/bin/cli';
  const changelog = pkg.changelog || 'miniapp-deploy auto update';
  const shellCommand = `${bin} --upload ${pkg.version}@${uploadProject} --upload-desc '${changelog}' > /dev/null`;
  
  console.log(shellCommand);
  
  shell.exec(shellCommand, function (code, stdout, stderr) {
    if (code !== 0) {
      shell.echo('生成失败');
      console.log('Exit code:', code);
      console.log('Program output:', stdout);
      console.log('Program stderr:', JSON.parse(stderr));
      shell.exit(1);
    }
    spinner.succeed('上传成功');
    spinner.stop();
  });
}

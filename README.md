> 注意，需要设置 open IDE -> Settings -> Security Settings, and set Service Port On

## 使用 ##
> 或者局部安装使用 npx 

```
npm install -g miniapp-deploy
# OR
yarn global add miniapp-deploy
```

## 配置

项目目录下新建 `miniapp.config.js`

```
module.exports = [
  { name: '小程序名字1', value: 'appid1' },
  { name: '小程序名字2', value: 'appid2' },
];

```

执行 `miniapp-deploy`
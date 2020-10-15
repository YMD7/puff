# Puff
## Puff Lunch
### Firebase Functions
#### デプロイ
`$ firebase deploy --only functions:puffLunch`
#### 環境変数を設定する
- `firebase functions:config:set someservice.id='xxx'`
- ローカルの開発環境で反映するには末尾に ` > .runtimeconfig.json` を追加して出力

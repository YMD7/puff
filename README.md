# Puff
## Puff Lunch
### Firebase Functions
#### ローカル実行
- Configuration を設定する
  - `$ firebase functions:config:get > .runtimeconfig.json`
  - 上記の `.runtimeconfig.json` は `functions/` に配置する
  - こうすることで、`functions/index.js` の `functions.config()` で設定を読み込める
- デバッグで Slack メッセージを `#onion-test` に投稿する
  - `functions/index.js` の `#157行目` あたり
  - `functions.config().slack.channel_id.e-random` を `.channel_id.onion_test` にする
- エミュレーターの起動
  - `$ firebase emulators:start --only functions` で起動できる
  - `--only functions` がないと、`firestore` もローカルで起動してしまうので注意
  - localhost を listen し始めたら、ターミナルに表示される URL にリクエストを投げる
  - ブラウザでも良いし、`$ curl http://localhost:5001/e-puff/asia-northeast1/puffLunch` みたいにしても良い
#### デプロイ
`$ firebase deploy --only functions:puffLunch`
#### 環境変数を設定する
- `firebase functions:config:set someservice.id='xxx'`
- ローカルの開発環境で反映するには末尾に ` > .runtimeconfig.json` を追加して出力

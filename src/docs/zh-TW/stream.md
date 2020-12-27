# ストリーミングAPI

ストリーミングAPIを使うと、リアルタイムで様々な情報(例えばタイムラインに新しい投稿が流れてきた、メッセージが届いた、フォローされた、など)を受け取ったり、様々な操作を行ったりすることができます。

## ストリームに接続する

ストリーミングAPIを利用するには、まずMisskeyサーバーに**websocket**接続する必要があります。

以下のURLに、`i`というパラメータ名で認証情報を含めて、websocket接続してください。例:
```
%WS_URL%/streaming?i=xxxxxxxxxxxxxxx
```

認証情報は、自分のAPIキーや、アプリケーションからストリームに接続する際はユーザーのアクセストークンのことを指します。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> 認証情報の取得については、<a href="./api">こちらのドキュメント</a>をご確認ください。</p>
</div>

---

認証情報は省略することもできますが、その場合非ログインでの利用ということになり、受信できる情報や可能な操作は限られます。例:

```
%WS_URL%/streaming
```

---

ストリームに接続すると、後述するAPI操作や、投稿の購読を行ったりすることができます。 しかしまだこの段階では、例えばタイムラインへの新しい投稿を受信したりすることはできません。 それを行うには、ストリーム上で、後述する**チャンネル**に接続する必要があります。

**ストリームでのやり取りはすべてJSONです。**

## 頻道
MisskeyのストリーミングAPIにはチャンネルという概念があります。これは、送受信する情報を分離するための仕組みです。 Misskeyのストリームに接続しただけでは、まだリアルタイムでタイムラインの投稿を受信したりはできません。 ストリーム上でチャンネルに接続することで、様々な情報を受け取ったり情報を送信したりすることができるようになります。

### チャンネルに接続する
チャンネルに接続するには、次のようなデータをJSONでストリームに送信します:

```json
{
    type: 'connect',
    body: {
        channel: 'xxxxxxxx',
        id: 'foobar',
        params: {
            ...
        }
    }
}
```

ここで、
* `channel`には接続したいチャンネル名を設定します。チャンネルの種類については後述します。
* `id`にはそのチャンネルとやり取りするための任意のIDを設定します。ストリームでは様々なメッセージが流れるので、そのメッセージがどのチャンネルからのものなのか識別する必要があるからです。このIDは、UUIDや、乱数のようなもので構いません。
* `params`はチャンネルに接続する際のパラメータです。チャンネルによって接続時に必要とされるパラメータは異なります。パラメータ不要のチャンネルに接続する際は、このプロパティは省略可能です。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> IDはチャンネルごとではなく「チャンネルの接続ごと」です。なぜなら、同じチャンネルに異なるパラメータで複数接続するケースもあるからです。</p>
</div>

### チャンネルからのメッセージを受け取る
例えばタイムラインのチャンネルなら、新しい投稿があった時にメッセージを発します。そのメッセージを受け取ることで、タイムラインに新しい投稿がされたことをリアルタイムで知ることができます。

チャンネルがメッセージを発すると、次のようなデータがJSONでストリームに流れてきます:
```json
{
    type: 'channel',
    body: {
        id: 'foobar',
        type: 'something',
        body: {
            some: 'thing'
        }
    }
}
```

ここで、
* `id`には前述したそのチャンネルに接続する際に設定したIDが設定されています。これで、このメッセージがどのチャンネルからのものなのか知ることができます。
* `type`にはメッセージの種類が設定されます。チャンネルによって、どのような種類のメッセージが流れてくるかは異なります。
* `body`にはメッセージの内容が設定されます。チャンネルによって、どのような内容のメッセージが流れてくるかは異なります。

### チャンネルに向けてメッセージを送信する
チャンネルによっては、メッセージを受け取るだけでなく、こちらから何かメッセージを送信し、何らかの操作を行える場合があります。

チャンネルにメッセージを送信するには、次のようなデータをJSONでストリームに送信します:
```json
{
    type: 'channel',
    body: {
        id: 'foobar',
        type: 'something',
        body: {
            some: 'thing'
        }
    }
}
```

ここで、
* `id`には前述したそのチャンネルに接続する際に設定したIDを設定します。これで、このメッセージがどのチャンネルに向けたものなのか識別させることができます。
* `type`にはメッセージの種類を設定します。チャンネルによって、どのような種類のメッセージを受け付けるかは異なります。
* `body`にはメッセージの内容を設定します。チャンネルによって、どのような内容のメッセージを受け付けるかは異なります。

### チャンネルから切断する
チャンネルから切断するには、次のようなデータをJSONでストリームに送信します:

```json
{
    type: 'disconnect',
    body: {
        id: 'foobar'
    }
}
```

ここで、
* `id`には前述したそのチャンネルに接続する際に設定したIDを設定します。

## ストリームを経由してAPIリクエストする

ストリームを経由してAPIリクエストすると、HTTPリクエストを発生させずにAPIを利用できます。そのため、コードを簡潔にできたり、パフォーマンスの向上を見込めるかもしれません。

ストリームを経由してAPIリクエストするには、次のようなデータをJSONでストリームに送信します:
```json
{
    type: 'api',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        endpoint: 'notes/create',
        data: {
            text: 'yee haw!'
        }
    }
}
```

ここで、
* `id`には、APIのレスポンスを識別するための、APIリクエストごとの一意なIDを設定する必要があります。UUIDや、簡単な乱数のようなもので構いません。
* `endpoint`には、あなたがリクエストしたいAPIのエンドポイントを指定します。
* `data`には、エンドポイントのパラメータを含めます。

<div class="ui info">
    <p><i class="fas fa-info-circle"></i> APIのエンドポイントやパラメータについてはAPIリファレンスをご確認ください。</p>
</div>

### レスポンスの受信

APIへリクエストすると、レスポンスがストリームから次のような形式で流れてきます。

```json
{
    type: 'api:xxxxxxxxxxxxxxxx',
    body: {
        ...
    }
}
```

ここで、
* `xxxxxxxxxxxxxxxx`の部分には、リクエストの際に設定された`id`が含まれています。これにより、どのリクエストに対するレスポンスなのか判別することができます。
* `body`には、レスポンスが含まれています。

## 投稿のキャプチャ

Misskeyは投稿のキャプチャと呼ばれる仕組みを提供しています。これは、指定した投稿のイベントをストリームで受け取る機能です。

例えばタイムラインを取得してユーザーに表示したとします。ここで誰かがそのタイムラインに含まれるどれかの投稿に対してリアクションしたとします。

しかし、クライアントからするとある投稿にリアクションが付いたことなどは知る由がないため、リアルタイムでリアクションをタイムライン上の投稿に反映して表示するといったことができません。

この問題を解決するために、Misskeyは投稿のキャプチャ機構を用意しています。投稿をキャプチャすると、その投稿に関するイベントを受け取ることができるため、リアルタイムでリアクションを反映させたりすることが可能になります。

### 投稿をキャプチャする

投稿をキャプチャするには、ストリームに次のようなメッセージを送信します:

```json
{
    type: 'subNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

ここで、
* `id`にキャプチャしたい投稿の`id`を設定します。

このメッセージを送信すると、Misskeyにキャプチャを要請したことになり、以後、その投稿に関するイベントが流れてくるようになります。

例えば投稿にリアクションが付いたとすると、次のようなメッセージが流れてきます:

```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'reacted',
        body: {
            reaction: 'like',
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

ここで、
* `body`内の`id`に、イベントを発生させた投稿のIDが設定されます。
* `body`内の`type`に、イベントの種類が設定されます。
* `body`内の`body`に、イベントの詳細が設定されます。

#### イベントの種類

##### `reacted`
その投稿にリアクションがされた時に発生します。

* `reaction`に、リアクションの種類が設定されます。
* `userId`に、リアクションを行ったユーザーのIDが設定されます。

例:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'reacted',
        body: {
            reaction: 'like',
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

##### `deleted`
その投稿が削除された時に発生します。

* `deletedAt`に、削除日時が設定されます。

例:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'deleted',
        body: {
            deletedAt: '2018-10-22T02:17:09.703Z'
        }
    }
}
```

##### `pollVoted`
その投稿に添付されたアンケートに投票された時に発生します。

* `choice`に、選択肢IDが設定されます。
* `userId`に、投票を行ったユーザーのIDが設定されます。

例:
```json
{
    type: 'noteUpdated',
    body: {
        id: 'xxxxxxxxxxxxxxxx',
        type: 'pollVoted',
        body: {
            choice: 2,
            userId: 'yyyyyyyyyyyyyyyy'
        }
    }
}
```

### 投稿のキャプチャを解除する

その投稿がもう画面に表示されなくなったりして、その投稿に関するイベントをもう受け取る必要がなくなったときは、キャプチャの解除を申請してください。

次のメッセージを送信します:

```json
{
    type: 'unsubNote',
    body: {
        id: 'xxxxxxxxxxxxxxxx'
    }
}
```

ここで、
* `id`にキャプチャを解除したい投稿の`id`を設定します。

このメッセージを送信すると、以後、その投稿に関するイベントは流れてこないようになります。

# チャンネル一覧
## `main`
アカウントに関する基本的な情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `renote`
自分の投稿がRenoteされた時に発生するイベントです。自分自身の投稿をRenoteしたときは発生しません。

#### `mention`
誰かからメンションされたときに発生するイベントです。

#### `readAllNotifications`
自分宛ての通知がすべて既読になったことを表すイベントです。このイベントを利用して、「通知があることを示すアイコン」のようなものをオフにしたりする等のケースが想定されます。

#### `meUpdated`
自分の情報が更新されたことを表すイベントです。

#### `follow`
自分が誰かをフォローしたときに発生するイベントです。

#### `unfollow`
自分が誰かのフォローを解除したときに発生するイベントです。

#### `followed`
自分が誰かにフォローされたときに発生するイベントです。

## `homeTimeline`
ホームタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
タイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `localTimeline`
ローカルタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
ローカルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `hybridTimeline`
ソーシャルタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
ソーシャルタイムラインに新しい投稿が流れてきたときに発生するイベントです。

## `globalTimeline`
グローバルタイムラインの投稿情報が流れてきます。このチャンネルにパラメータはありません。

### 流れてくるイベント一覧

#### `note`
グローバルタイムラインに新しい投稿が流れてきたときに発生するイベントです。
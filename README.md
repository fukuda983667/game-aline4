# docker-next-laravel

docker-next-laravelのひな形

## 環境構築

1. リポジトリをクローンしたい任意のディレクトリで以下のコマンドを実行してください。

    ```bash
    git clone https://github.com/fukuda983667/docker-next-laravel
    ```

2. クローンしたディレクトリに移動

    ```bash
    cd docker-next-laravel
    ```

3. Docker Composeを使用してコンテナを作成・起動します。※Docker Descktop起動時に実行してください。

    ```bash
    docker-compose up -d --build
    ```

4. phpコンテナにログイン→`composer`をインストールします。

    ```bash
    docker-compose exec php bash
    ```
    ```
    composer install
    ```

5. `.env.example`ファイルをコピーして`.env`ファイルを作成します。

    ```bash
    cp .env.example .env
    ```

6. `.env`ファイルを編集し、必要な環境変数を設定します（5行目）。

   ```
   APP_URL=http://localhost:8080
   ```

6. `.env`ファイルを編集し、必要な環境変数を設定します（11～16行目）。

   ```
   DB_CONNECTION=mysql
   DB_HOST=mysql
   DB_PORT=3306
   DB_DATABASE=laravel_db
   DB_USERNAME=laravel_user
   DB_PASSWORD=laravel_pass
   ```

7. アプリケーションキーを生成します。

    ```bash
    php artisan key:generate
    ```

8. データベースのマイグレーションを実行します。

    ```bash
    php artisan migrate
    ```

## URL

- next : http://localhost:3000
- larael : http://localhost:8080
- phpMyAdmin : http://localhost:8081


## リモートリポジトリとの紐付けを解除 
```
git remote remove origin
```

## ローカルリポジトリの削除  
`git clone`したローカルリポジトリを完全に削除します。  
```
sudo rm -rf docker-next-laravel
```
# game-aline4

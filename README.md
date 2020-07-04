# Qiita KPI
GAS Projects for record of Qiita KPI.

Record the following count to google spredsheet.

- Post Count
- LGTM Count
- Stock Count
- Follower Count
- Hatena Bookmark Count

![スクリーンショット 2020-07-04 17 40 55](https://user-images.githubusercontent.com/11070996/86521329-37d9b400-be8a-11ea-8c6a-5f0a7178ea15.png)


# Usage

Clone this repository and create clasp projects.

```
$ git clone https://github.com/kawamataryo/qiita-kpi.git
$ cd qiita-kpi

$ npm i @google/clasp -g
$ clasp create --title qiita-kpi --type sheets --rootDir ./src
```

Push projects to GAS.

```
$ clasp push
```

Set projects property on GAS editor page.

|property|value|
|---|---|
|qiitaAccessToken|Qiita API access token. Get it from [here](https://qiita.com/api/v2/docs)|
|qiitaUsername|Qiita account name|

![スクリーンショット 2020-07-04 15 53 31](https://user-images.githubusercontent.com/11070996/86521312-f47f4580-be89-11ea-9af4-26a88c205e51.png)


Run script.

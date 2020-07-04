import { User, Item } from "./types/qiita-types";

const QIITA_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty(
  "qiitaAccessToken"
) as string;
const QIITA_USERNAME = PropertiesService.getScriptProperties().getProperty(
  "qiitaUsername"
) as string;

// -------------------------------------------------------------
// メイン処理 各指標のスプレッドシートへの書き込み
// -------------------------------------------------------------
function main() {
  const today = Utilities.formatDate(new Date(), "JST", "yyyy/MM/dd");
  // Qiitaの指標取得
  const qiitaKpi = new QiitaClient(
    QIITA_ACCESS_TOKEN,
    QIITA_USERNAME
  ).fetchKpi();
  // はてなの指標取得
  const hatenaKpi = new HatenaClient(QIITA_USERNAME).fetchKpi();

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const insertLow = sheet.getLastRow() + 1;
  [
    today,
    qiitaKpi.postCount,
    qiitaKpi.lgtmCount,
    qiitaKpi.stockCount,
    qiitaKpi.followersCount,
    hatenaKpi.bookmarkCount
  ].forEach((data, i) => {
    sheet.getRange(insertLow, i + 1).setValue(data);
  });
}

// -------------------------------------------------------------
// Qiita API Client
// -------------------------------------------------------------
class QiitaClient {
  private readonly BASE_URL = "https://qiita.com/api/v2";
  private readonly PER_PAGE = 100;
  private readonly FETCH_OPTION = {
    headers: {
      Authorization: `Bearer ${this.accessToken}`,
    },
    method: "get" as const,
  };

  constructor(private accessToken: string, private username: string) {}

  // Qiita APIから指標取得
  fetchKpi() {
    const user = this.fetchUser();
    const items = this.fetchAllItems(user);
    const lgtmCount = this.tallyUpLgtmCount(items);
    const stockCount = this.tallyUpStockCount(items);

    return {
      lgtmCount,
      stockCount,
      followersCount: user.followers_count,
      postCount: user.items_count,
    };
  }

  // ユーザー情報の取得
  private fetchUser() {
    const response = UrlFetchApp.fetch(
      `${this.BASE_URL}/users/${this.username}`,
      this.FETCH_OPTION
    );
    return JSON.parse(response.getContentText()) as User;
  }

  // 全ての投稿記事の取得
  private fetchAllItems(user: User) {
    // 最大ページ数
    const maxPage = Math.ceil(user.items_count / this.PER_PAGE);
    // 投稿一覧の取得
    let allItems = [] as Item[];
    [...Array(maxPage)].forEach((_, i) => {
      const page = i + 1;
      const items = this.fetchItems(page, this.PER_PAGE);
      allItems = [...allItems, ...items];
    });
    return allItems;
  }

  // 投稿記事の取得
  private fetchItems(page: number, perPage: number) {
    const response = UrlFetchApp.fetch(
      `${this.BASE_URL}/authenticated_user/items?page=${page}&per_page=${perPage}`,
      this.FETCH_OPTION
    );
    return JSON.parse(response.getContentText()) as Item[];
  }

  // 記事をストックしたユーザーの取得
  private fetchStockers(itemId: string) {
    const response = UrlFetchApp.fetch(
      `${this.BASE_URL}/items/${itemId}/stockers`,
      this.FETCH_OPTION
    );
    return JSON.parse(response.getContentText()) as User[];
  }

  // LGTM数の集計
  private tallyUpLgtmCount(items: Item[]) {
    const lgtmCount = items.reduce(
      (result, item) => result + item.likes_count,
      0
    );
    return lgtmCount;
  }

  // ストック数の集計
  private tallyUpStockCount(items: Item[]) {
    const stockCount = items.reduce((result, item) => {
      const stockedUser = this.fetchStockers(item.id);
      return result + stockedUser.length;
    }, 0);
    return stockCount;
  }
}

// -------------------------------------------------------------
// Hatena API Client
// -------------------------------------------------------------
class HatenaClient {
  private readonly BASE_URL = "http://b.hatena.ne.jp";

  constructor(private qiitaUsername: string) {}

  // はてな APIから指標取得
  fetchKpi() {
    const bookmarkCount = this.fetchBookmarkCount();

    return {
      bookmarkCount,
    };
  }

  // ブックマークカウントの集計
  private fetchBookmarkCount() {
    const redirectUrl = this.getRedirectUrl(
      `${this.BASE_URL}/bc/https://qiita.com/${this.qiitaUsername}`
    );
    // `https://b.st-hatena.com/images/counter/default/00/00/0000653.gif` の形式で
    // ブクマ数が書かれたgif画像のURLを取得できるので、そこからブクマ数だけを抽出する
    const bookmarkCount = redirectUrl.match(
      /https:\/\/b.st-hatena\.com\/images\/counter\/default\/\d+\/\d+\/(\d+).gif/
    )![1];

    return Number(bookmarkCount);
  }

  // リダイレクトURLの取得
  private getRedirectUrl(url: string): string {
    const response = UrlFetchApp.fetch(url, {
      followRedirects: false,
      muteHttpExceptions: false,
    });
    const redirectUrl = (response.getHeaders() as any)["Location"] as string;
    if (redirectUrl) {
      const nextRedirectUrl = this.getRedirectUrl(redirectUrl);
      return nextRedirectUrl;
    } else {
      return url;
    }
  }
}
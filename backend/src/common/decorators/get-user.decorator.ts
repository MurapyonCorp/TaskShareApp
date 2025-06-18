import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * =========================
 *  @GetUser() デコレーター
 * =========================
 * ・JWT などの認証ガードが request に注入した `user` オブジェクトを
 *   コントローラのメソッド引数からサクッと受け取るためのカスタムデコレーター。
 * ・使い方: `getMe(@GetUser() user: User) { ... }`
 * ・シンプルだけど再利用性バツグン！
 */
export const GetUser = createParamDecorator(
  /**
   * Nest が実行時に呼び出すファクトリ関数。
   *
   * @param data - デコレーター呼び出し時に渡される任意データ（今回は使わないので unknown）
   * @param ctx  - Runtime の ExecutionContext（HTTP 以外のプロトコルにも対応したラッパー）
   *
   * @returns request.user - Passport などの Auth ガードが仕込んだユーザー情報
   */
  (data: unknown, ctx: ExecutionContext) => {
    // ① HTTP コンテキストへスイッチして…
    const request = ctx.switchToHttp().getRequest();
    // ② ガード（JwtAuthGuard 等）が埋め込んだ `user` をそのまま返す
    return request.user;
  },
);

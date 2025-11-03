import { ValidationOptions, registerDecorator, ValidationArguments } from "class-validator";

// Match デコレータを作成する関数
// 引数: property → 比較対象となるプロパティ名
//       validationOptions → バリデーションのオプション（エラーメッセージやグループ設定など）
export function Match(property: string, validationOptions?: ValidationOptions) {
  // デコレータ本体（対象オブジェクトとプロパティ名が渡される）
  return function (object: Object, propertyName: string) {
    // class-validator の registerDecorator を使って独自ルールを登録
    registerDecorator({
      // バリデータの名前（任意の識別子）
      name: 'Match',
      // デコレータを適用したクラス（ターゲット）
      target: object.constructor,
      // デコレータを適用したプロパティ名
      propertyName: propertyName,
      // エラーメッセージやその他のバリデーションオプション
      options: validationOptions,
      // 比較対象のプロパティ名を constraints に保持しておく
      constraints: [property],
      // 実際のバリデーション処理を定義
      validator: {
        // 値が有効かどうか判定する関数
        validate(value: any, args: ValidationArguments) {
          // constraints に入れておいた比較対象のプロパティ名を取り出す
          const [relatedPropertyName] = args.constraints;
          // バリデーション対象オブジェクトから比較対象の値を取得
          const relatedValue = (args.object as any)[relatedPropertyName];
          // 値が一致しているかをチェック（true ならバリデーション成功）
          return value === relatedValue;
        },
        // バリデーション失敗時のデフォルトメッセージ
        defaultMessage(args: ValidationArguments) {
          // constraints に入れた比較対象のプロパティ名を使う
          const [relatedPropertyName] = args.constraints;
          // 例: "confirmPassword must match password"
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}
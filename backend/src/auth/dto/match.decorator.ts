import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Matchデコレーターを定義。引数には比較対象のプロパティ名（例: 'password'）とオプション。
export function Match(property: string, validationOptions?: ValidationOptions) {
  // デコレーターとして使うために、戻り値として関数を返す（propertyNameは現在のプロパティ名）
  return function (object: Object, propertyName: string) {
    // バリデーションの登録処理
    registerDecorator({
      // バリデーションの一意の名前（任意の名前でOK）
      name: 'Match',
      // バリデーション対象のクラス（オブジェクトのコンストラクタ）
      target: object.constructor,
      // 対象のプロパティ名（例: confirmPassword）
      propertyName: propertyName,
      // バリデーションオプション（messageなど）
      options: validationOptions,
      // 比較対象となるプロパティ名をconstraintsに保存
      constraints: [property],
      // 実際のバリデーション処理を定義
      validator: {
        // validate関数：バリデーションロジック本体
        validate(value: any, args: ValidationArguments) {
          // 比較対象のプロパティ名を取得（constraints配列の1番目）
          const [relatedPropertyName] = args.constraints;
          // オブジェクト全体から比較対象のプロパティの値を取得
          const relatedValue = (args.object as any)[relatedPropertyName];
          // 現在の値と比較対象の値が一致していればtrueを返す
          return value === relatedValue;
        },
        // バリデーション失敗時のエラーメッセージを定義
        defaultMessage(args: ValidationArguments) {
          // 比較対象のプロパティ名を取得
          const [relatedPropertyName] = args.constraints;
          // `${args.property} must match ${relatedPropertyName}` の形式で返す
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}

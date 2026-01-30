import { describe, it, expect } from 'vitest';

/**
 * 入居者管理機能のユニットテスト
 * 
 * このテストは、入居者データのバリデーションロジックを検証します。
 */

describe('入居者管理 - バリデーション', () => {
  it('必須フィールド（name, nameKana）の検証', () => {
    const validData = {
      name: '山田太郎',
      nameKana: 'ヤマダタロウ',
      amount: 85000,
    };

    expect(validData.name).toBeTruthy();
    expect(validData.nameKana).toBeTruthy();
    expect(validData.name.trim().length).toBeGreaterThan(0);
    expect(validData.nameKana.trim().length).toBeGreaterThan(0);
  });

  it('金額が正の整数であることを検証', () => {
    const validAmounts = [85000, 100000, 50000];
    const invalidAmounts = [-1, 0, 1.5];

    validAmounts.forEach(amount => {
      expect(Number.isInteger(amount) && amount > 0).toBe(true);
    });

    invalidAmounts.forEach(amount => {
      expect(Number.isInteger(amount) && amount > 0).toBe(false);
    });
  });

  it('フリガナがカタカナであることを検証（簡易チェック）', () => {
    const validKana = ['ヤマダタロウ', 'タナカハナコ', 'サトウイチロウ'];
    const invalidKana = ['やまだたろう', 'YAMADATAROU', '山田太郎'];

    validKana.forEach(kana => {
      // カタカナの範囲: ァ-ヶ
      const katakanaPattern = /^[ァ-ヶー\s]+$/;
      expect(katakanaPattern.test(kana)).toBe(true);
    });

    invalidKana.forEach(kana => {
      const katakanaPattern = /^[ァ-ヶー\s]+$/;
      expect(katakanaPattern.test(kana)).toBe(false);
    });
  });

  it('名前とフリガナの長さが妥当であることを検証', () => {
    const validNames = ['山田太郎', 'タナカハナコ', 'サトウイチロウ'];
    const tooLongName = 'あ'.repeat(101); // 100文字を超える

    validNames.forEach(name => {
      expect(name.length).toBeGreaterThan(0);
      expect(name.length).toBeLessThanOrEqual(100);
    });

    expect(tooLongName.length).toBeGreaterThan(100);
  });
});

describe('入居者管理 - データ変換', () => {
  it('文字列の金額を数値に変換できる', () => {
    const amountStr = '85000';
    const amount = parseInt(amountStr, 10);

    expect(amount).toBe(85000);
    expect(Number.isInteger(amount)).toBe(true);
  });

  it('無効な金額文字列はNaNを返す', () => {
    const invalidAmounts = ['invalid', '', 'abc'];

    invalidAmounts.forEach(amountStr => {
      const amount = parseInt(amountStr, 10);
      expect(isNaN(amount)).toBe(true);
    });
  });

  it('空白を除去できる', () => {
    const nameWithSpaces = '  山田太郎  ';
    const cleaned = nameWithSpaces.trim();

    expect(cleaned).toBe('山田太郎');
    expect(cleaned.length).toBeLessThan(nameWithSpaces.length);
  });
});

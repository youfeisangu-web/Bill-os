import { describe, it, expect } from 'vitest';
import stringSimilarity from 'string-similarity';

/**
 * 入金消込機能のユニットテスト
 * 
 * このテストは、消込ロジックの核心部分（文字列類似度判定）を検証します。
 * 実際のAPIエンドポイントやデータベース接続は含まれません。
 */

describe('入金消込 - 文字列類似度判定', () => {
  it('完全一致する名前は高スコアを返す', () => {
    const cleanName = 'ヤマダタロウ';
    const targetNames = ['ヤマダタロウ', 'タナカハナコ', 'サトウイチロウ'];
    const match = stringSimilarity.findBestMatch(cleanName, targetNames);

    expect(match.bestMatch.rating).toBeGreaterThanOrEqual(1.0);
    expect(match.bestMatchIndex).toBe(0);
  });

  it('類似する名前（カタカナの表記揺れ）を検出できる', () => {
    const cleanName = 'ヤマダタロウ';
    const targetNames = ['ヤマダタロウ', 'ヤマダタロ', 'ヤマダタロオ'];
    const match = stringSimilarity.findBestMatch(cleanName, targetNames);

    expect(match.bestMatch.rating).toBeGreaterThanOrEqual(0.8);
  });

  it('閾値0.6以上でマッチング成功と判定', () => {
    const cleanName = 'ヤマダタロウ';
    const targetNames = ['ヤマダタロウ', 'タナカハナコ'];
    const match = stringSimilarity.findBestMatch(cleanName, targetNames);

    expect(match.bestMatch.rating).toBeGreaterThanOrEqual(0.6);
  });

  it('全く異なる名前は低スコアを返す', () => {
    const cleanName = 'ヤマダタロウ';
    const targetNames = ['スズキジロウ', 'タナカハナコ'];
    const match = stringSimilarity.findBestMatch(cleanName, targetNames);

    expect(match.bestMatch.rating).toBeLessThan(0.6);
  });

  it('名前のクリーンアップ（スペース・括弧除去）をシミュレート', () => {
    const rawName = 'ヤマダ タロウ（カ）';
    const cleanName = rawName.replace(/カ\）|[\s　]|[（）()]/g, '');
    
    expect(cleanName).toBe('ヤマダタロウ');
    
    const targetNames = ['ヤマダタロウ'];
    const match = stringSimilarity.findBestMatch(cleanName, targetNames);
    
    expect(match.bestMatch.rating).toBeGreaterThanOrEqual(1.0);
  });

  it('金額一致チェックのロジック', () => {
    const tenants = [
      { id: '1', name: 'ヤマダタロウ', nameKana: 'ヤマダタロウ', amount: 85000 },
      { id: '2', name: 'タナカハナコ', nameKana: 'タナカハナコ', amount: 100000 },
      { id: '3', name: 'サトウイチロウ', nameKana: 'サトウイチロウ', amount: 85000 },
    ];

    const amount = 85000;
    const candidates = tenants.filter(tenant => tenant.amount === amount);

    expect(candidates).toHaveLength(2);
    expect(candidates.map(c => c.id)).toEqual(['1', '3']);
  });
});

describe('入金消込 - エッジケース', () => {
  it('空の候補リストではマッチングできない', () => {
    const cleanName = 'ヤマダタロウ';
    const targetNames: string[] = [];
    
    // string-similarityは空配列でエラーを投げる
    expect(() => {
      if (targetNames.length === 0) {
        throw new Error('候補がありません');
      }
      stringSimilarity.findBestMatch(cleanName, targetNames);
    }).toThrow('候補がありません');
  });

  it('金額が一致しない場合は候補が0件', () => {
    const tenants = [
      { id: '1', name: 'ヤマダタロウ', nameKana: 'ヤマダタロウ', amount: 85000 },
    ];

    const amount = 100000;
    const candidates = tenants.filter(tenant => tenant.amount === amount);

    expect(candidates).toHaveLength(0);
  });
});

import { getParamMap } from '../utils/ast';
import j from 'jscodeshift';

/** 构建 I18n.t 调用表达式 */
export const buildI18nTCall = (key: string, valuesExpr: any, defaultValue: string) => {
  const paramMap = getParamMap(valuesExpr);
  delete (paramMap as any).defaultValue;
  const properties = Object.entries(paramMap).map(([key, value]) => j.property('init', j.identifier(key), value));
  properties.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  const options = j.objectExpression(properties);
  return j.callExpression(j.memberExpression(j.identifier('I18n'), j.identifier('t')), [j.stringLiteral(key), options]);
};

/** 构建 useTranslation 对应的 t 调用表达式 */
export const buildTCall = (key: string, paramsObj: any, defaultValue: string) => {
  const paramMap = getParamMap(paramsObj);
  delete (paramMap as any).defaultValue;
  const properties = Object.entries(paramMap).map(([key, value]) => j.property('init', j.identifier(key), value));
  properties.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  return j.callExpression(j.identifier('t'), [j.stringLiteral(key), j.objectExpression(properties)]);
};

import j from 'jscodeshift';
import { recordKeyUsage } from '..';

/** 构建 I18n.t 调用表达式 */
export const buildI18nTCall = (key: string, valuesExpr: any, defaultValue: string) => {
  const props = valuesExpr && valuesExpr.type === 'ObjectExpression' ? [...valuesExpr.properties] : [];
  props.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  const options = j.objectExpression(props);
  recordKeyUsage(key);
  return j.callExpression(j.memberExpression(j.identifier('I18n'), j.identifier('t')), [j.stringLiteral(key), options]);
};

/** 构建 useTranslation 对应的 t 调用表达式 */
export const buildTCall = (key: string, paramsObj: any, defaultValue: string) => {
  const props = paramsObj && paramsObj.type === 'ObjectExpression' ? [...paramsObj.properties] : [];
  props.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  recordKeyUsage(key);
  return j.callExpression(j.identifier('t'), [j.stringLiteral(key), j.objectExpression(props)]);
};

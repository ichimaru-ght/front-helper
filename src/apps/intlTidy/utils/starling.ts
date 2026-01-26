import { messages } from '..';
import { getParamMap } from '../utils';
import j from 'jscodeshift';

/** 构建 I18n.t 调用表达式 */
export const buildI18nTCall = (
  idOrNull: string | null,
  idNode: any,
  valuesExpr: any,
  defaultMessage: string | null,
  fallbackString: string | null,
) => {
  const paramMap = getParamMap(valuesExpr);
  delete (paramMap as any).defaultValue;
  const properties = Object.entries(paramMap).map(([key, value]) => j.property('init', j.identifier(key), value));
  const defaultValue =
    (idOrNull ? messages[idOrNull] : null) || (idOrNull ? idOrNull : null) || defaultMessage || fallbackString || '';
  properties.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  const options = j.objectExpression(properties);
  const idArg = idNode || (idOrNull ? j.literal(idOrNull) : j.literal(''));
  return j.callExpression(j.memberExpression(j.identifier('I18n'), j.identifier('t')), [idArg, options]);
};

/** 构建 useTranslation 对应的 t 调用表达式 */
export const buildTCall = (messageId: string, paramsObj: any, defaultValue: string) => {
  const paramMap = getParamMap(paramsObj);
  delete (paramMap as any).defaultValue;
  const properties = Object.entries(paramMap).map(([key, value]) => j.property('init', j.identifier(key), value));
  properties.push(j.property('init', j.identifier('defaultValue'), j.stringLiteral(defaultValue)));
  return j.callExpression(j.identifier('t'), [j.stringLiteral(messageId), j.objectExpression(properties)]);
};

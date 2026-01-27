// ----- 替换前样例
const { reroute, title: sortTitle, element: { data }, tip } = useLanguage();

// usage
const rerouteName = reroute.name;

const routeTip = tip;

<div>{sortTitle}</div>

const title = getMessage(data, {
value: { name: bagName ,'bag-1' },
})

// ----- 替换后样例
const { t } = useTranslation();

// usage
const rerouteName = t('reroute_name', {defaultValue: 'Re Route Name'})

const routeTip = t('tip', {defaultValue: 'Tip'})

<div>{t('sortTitle', {defaultValue: 'Sort Title'})}</div>

const title = t('element_data', {name: bagName ,'bag-1', defaultValue: 'Element data is {name}'})

/*
combined files : 

gallery/tsearch/1.1/build/common
gallery/tsearch/1.1/build/trip-autocomplete
gallery/tsearch/1.1/build/tradio
gallery/tsearch/1.1/tsearch

*/
/**
 * 旅行公共函数库
 */
KISSY.add('gallery/tsearch/1.1/build/common',function (S){
    var Common = {
        /**
         * 截取指定长度的字符串
         * @param string 被截取的字符串
         * @param len 截取的长度，单位：字节。1个汉汉字为2个字节
         * @return {string} 返回被截取的字符串
         */
        subString:function (string, len) {
            var r = /[^\x00-\xff]/g;
            if (!string) {
                return '';
            }
            if (string.replace(r, "mm").length <= len) return string;
            var m = Math.floor(len / 2);
            for (var i = m; i < string.length; i++) {
                if (string.substr(0, i).replace(r, "mm").length >= len) {
                    return string.substr(0, i);
                }
            }
            return string;
        },
        /**
         * 获取字符串长度 单位字节
         * @param string
         * @return {*}
         */
        stringLen :function (string) {
            if (!string) {
                return '';
            }
            return string.replace(/[^\x00-\xff]/g, "rr").length;
        },
        /**
         * 截取字符串，并在末尾加上'...'
         * @param str  被截取的字符串
         * @param len  截取的长度
         * @param more 省略符号
         * @return {*}
         */
        cutStr :function (str, len , more) {
            more = more || '...';
            if (Common.stringLen(str) > len) {
                return Common.subString(str, len - 4) + more;
            }
            return str;
        },
        /**
         * 处理对象的属性的长度
         * @param obj
         * @param attr
         * @param len
         */
        buildObjCutAttr:function (obj, attr, len) {
            obj[attr + '_sub'] = Common.cutStr(obj[attr], len);
        },
        /**
         * 把 '1' 转化为 '01'
         * @param n
         * @return {*}
         */
        singleDateToDouble:function (n) {
            return n.toString().length > 1 ? n.toString() : '0' + n.toString();
        },
        /**
         * 将 2012-12-12 字符串格式转换为 Date 对象
         * @param str
         */
        strToDate : function (str){
            var arr = str.split('-');
            return new Date(arr[0], arr[1]-1 , arr[2]);
        },
        /**
         * 计算日期间隔，2011-5-17至2011-05-18间隔为一天
         * @param fromDate 开始日期
         * @param toDate 结束日期
         * @return {Number} 间隔天数
         */
        getDateInterval : function (fromDate, toDate) {
            return parseInt(Math.abs(Common.strToDate(toDate) - Common.strToDate(fromDate)) / 1000 / 60 / 60 / 24);
        },
        /**
         * 返回一个对象包括各种需要的日期格式
         * @param n 标准日期或毫秒
         */
        formatDate:function (n) {
            var date = new Date(n),
                formentLen = Common.singleDateToDouble;
            var yy = date.getFullYear();
            var mm = formentLen(date.getMonth() + 1);
            var dd = formentLen(date.getDate());
            var hh = formentLen(date.getHours());
            var MM = formentLen(date.getMinutes());
            return {
                mmdd:mm + '-' + dd,
                yymmdd:yy + '-' + mm + '-' + dd,
                hhMM:hh + ':' + MM,
                yy:yy,
                mm:mm,
                dd:dd,
                hh:hh,
                MM:MM
            }
        },
        /**
         * 获取指定日期的偏移量 n=1为明天 n=2为后天，支持昨天前天...
         * @param date
         * @param n 偏移的天数
         * @return {Date}
         */
        setDate : function (date , n){
            return new Date(date.getTime()+n*86400000);
        },
        /**
         * 根据毫秒计算时长
         * @param t
         * @return {Object}
         */
        timeToDuration:function (t) {
            t = t / 1000;
            var h = Math.floor(t / 3600);
            var s = Math.floor((t - h * 3600) / 60);
            var m = t % 60;
            return {
                h:h,
                s:s,
                m:m
            }
        },
        /**
         * 将转以后的HTML字符进行还原
         * @param html
         * @return {*}
         */
        html2text:function (html) {
            var el = document.createElement("div");
            el.innerHTML = html;
            try {
                return typeof el.innerText === "string" ? el.innerText : el.textContent;
            } catch (e) {
                return html;
            }
        }
    };
    return Common;
});
KISSY.add('gallery/tsearch/1.1/build/trip-autocomplete',function (S, Ac , Common) {
    var ALIGH = {
        node    : null,
        points  : ['bl', 'tl'],
        overflow: {
            adjustX: false,
            adjustY: true
        }
    };
    var DOMAIN = location.href.indexOf('ac-daily') > -1? 'daily.taobao.net' : 'taobao.com';
    return  {
        flight : function (cfg) {
            var default_cfg = {
                source           : 'http://s.jipiao.trip.' + DOMAIN +'/city_search.do?lines={maxResults}&q={query}',
                resultListLocator: function (results) {
                    results = results.result;
                    var filtedData = [];
                    //根据接口进行临近城市的数据处理
                    S.each(results, function (_item) {
                        if (_item.hasAirport) {
                            filtedData.push(_item);
                        } else {
                            var nearCities = _item.nearCity;
                            S.each(nearCities, function (nearCity) {
                                var nearCityFormat = S.mix(nearCity, {
                                    nearCity: _item.cityName
                                });
                                filtedData.push(nearCityFormat);
                            });
                        }
                    });
                    return filtedData;
                },//指定返回数据里的数组位置
                resultTextLocator: 'cityName',//指定文本内容
                activeFirstItem  : true,
                align            : ALIGH,
                hotSource        : 'http://www.' + DOMAIN +'/go/rgn/trip/chinahotcity_jsonp.php',//不指定及没有热门推荐
                resultFormatter  : function (query, results) {//对展示进行格式化
                    var result = [];
                    var tmpl = '<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityname}</span><span class="ks-ac-intro">{py}</span></div>';
                    var prevNearCity = '';
                    //临近城市的显示处理
                    for (var idx in results) {
                        var _item = results[idx];
                        if (!_item.raw.nearCity) {
                            //有机场，未设置nearCity
                            result.push(S.substitute(tmpl, {
                                cityname: _item.text,
                                py      : _item.raw.py
                            }));
                        } else {
                            //无机场，处理附近城市
                            var html = '<div class="ks-ac-item"><div class="ks-ac-near-tip">"' + _item.raw.nearCity + '"&nbsp;没有机场</div>';
                            var nearAirportTpl = '<div class="ks-ac-item-inner ks-ac-item-inner-sub"><span class="ks-ac-name">邻近机场：{cityName}&nbsp;--&nbsp;距离{distance}公里</span></div>';
                            var cityHtml = S.substitute(nearAirportTpl, {
                                cityName: _item.text,
                                distance: _item.raw.distance
                            });

                            if (_item.raw.nearCity != prevNearCity) {
                                //对于首个附近机场城市，加入tip
                                html += cityHtml + '</div>';
                                prevNearCity = _item.raw.nearCity;
                            } else {
                                html = cityHtml;
                            }
                            result.push(html);
                        }
                    }
                    return result;
                }
            };
            cfg = S.merge(default_cfg , cfg);
            var acInstance = new Ac(cfg);
            var codeInputNode = acInstance.get('codeInputNode');
            codeInputNode =  codeInputNode instanceof  S.NodeList ? codeInputNode : S.one(codeInputNode);
            codeInputNode &&  acInstance.on('select' , function (e){
                codeInputNode.val(e.result.raw.cityCode);
            });
            return acInstance;
        },
        iflight: function (cfg) {
            var default_cfg = {
                source       : 'http://ijipiao.trip.' + DOMAIN +'/ie/remote/auto_complete.do?flag=4&count=10&callback={callback}&q={query}',
                resultListLocator:'result',//指定返回数据里的数组位置
                resultTextLocator: 'cityName',//指定文本内容
                activeFirstItem  : true,
                align            : ALIGH ,
                hotSource    : 'http://www.' + DOMAIN +'/go/rgn/trip/international_jsonp.php'
            };
            cfg = S.merge(default_cfg, cfg);
            var acInstance = new Ac(cfg);
            var codeInputNode = acInstance.get('codeInputNode');
            codeInputNode = codeInputNode instanceof  S.NodeList ? codeInputNode : S.one(codeInputNode);
            codeInputNode && acInstance.on('select', function (e) {
                codeInputNode.val(e.result.raw.cityCode);
            });
            return acInstance;
        },
        hotel  : function (cfg) {

            // 目的地 suggest 结果预处理
            function hotelCityListLocator(data) {
                var rawResults = data.result;
                var results = [];
                if (S.isArray(rawResults) && rawResults.length) {
                    S.map(rawResults, function (item, index) {
                        var suggests = item.t.split('_');
                        results.push({
                            cityName: suggests[0],
                            cityCode: item.c,
                            py      : suggests[1]
                        })
                    });
                }
                return results;
            }

            // 目的地 suggest 结果格式化
            function hotelCityFormatter(query, results) {
                return S.map(results, function (item) {
                    var result = item.raw;
                    return S.substitute('<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityName}</span><span class="ks-ac-intro">{py}</span></div>', {
                        cityName: Common.cutStr(result.cityName, 20),
                        py      : Common.cutStr(result.py, 10)
                    });
                });
            }
            var default_cfg = {
                activeFirstItem  : true,
                align            : ALIGH,
                resultListLocator: hotelCityListLocator,
                resultFormatter  : hotelCityFormatter,
                resultTextLocator: 'cityName',//指定文本内容
                source           : 'http://kezhan.trip.' + DOMAIN +'/citysuggest.do?t=0&q={query}',
                hotSource        : 'http://www.' + DOMAIN +'/go/rgn/trip/hotelhotcityv2_jsonp.php'
            };
            cfg = S.merge(default_cfg, cfg);
            var acInstance = new Ac(cfg);
            var codeInputNode = acInstance.get('codeInputNode');
            codeInputNode = codeInputNode instanceof  S.NodeList ? codeInputNode : S.one(codeInputNode);
            codeInputNode && acInstance.on('select', function (e) {
                codeInputNode.val(e.result.raw.cityCode);
            });
            return acInstance;
        },
        travel : function (cfg) {
            var isDaily = document.domain.indexOf('daily.taobao.net') > 1,
                _resultTmpl = '<div class="ks-ac-item-inner"><span class="ks-ac-name">{first}</span><span class="ks-ac-intro" style="color:#999;float:left;">{second}</span></div>',
                _citycodeUrl = (isDaily ? 'http://go.daily.taobao.net/' : 'http://go.' + DOMAIN +'/') + 'data/areaTrip.htm?sn=1'; //城市联想接口
            _dep_citycodeUrl = (isDaily ? 'http://dujia.trip.daily.taobao.net/' : 'http://dujia.trip.' + DOMAIN +'/') + 'sell/ajax/get_sug_city.htm?max=10'; //城市联想接口


            function highLight(str, key) {
                //return str.replace(key,'<span class="yui3-highlight">'+ key +'</span>');
                return str;
            }

            function _acFormatter(query, results) {
                return S.map(results, function (result) {
                    var result = result.raw,
                        _name = result.cityName.split('-');
                    return S.substitute(_resultTmpl, {
                        first : highLight(_name[0], query),
                        second: highLight(_name[1], query) ? '&nbsp;-&nbsp;' + highLight(_name[1], query) : ''
                    });
                });
            }

            var default_cfg = {
                activeFirstItem  : true,
                align            : ALIGH,
                resultListLocator: 'result',
                resultTextLocator: 'cityName',
                resultFormatter: _acFormatter,
                source         : _dep_citycodeUrl + '&q={query}',
                hotSource      : 'http://www.' + DOMAIN +'/go/rgn/trip/dujiadephotcity_jsonp.php'
            };
            cfg = S.merge(default_cfg, cfg);
            var acInstance = new Ac(cfg);
            var codeInputNode = acInstance.get('codeInputNode');
            codeInputNode = codeInputNode instanceof  S.NodeList ? codeInputNode : S.one(codeInputNode);
            codeInputNode && acInstance.on('select', function (e) {
                codeInputNode.val(e.result.raw.cityCode);
            });
            return acInstance;
        },
        train : function (cfg){
            var default_cfg = {
                source           : 'http://s.train.trip.' + DOMAIN + '/station_suggestion.htm?lines={maxResults}&callback={callback}&q={query}',
                resultListLocator: 'results',//指定返回数据里的数组位置
                resultTextLocator: 'stationName',//指定文本内容
                activeFirstItem  : true,
                align            : ALIGH,
                hotSource        : 'http://www.' + DOMAIN + '/go/rgn/trip/chinahotcity_jsonp.php'
            };
            cfg = S.merge(default_cfg, cfg);
            var acInstance = new Ac(cfg);
            return acInstance;
        },
        city : function (cfg){
            var default_cfg = {
                source           : 'http://s.jipiao.trip.' + DOMAIN +'/city_search.do?lines={maxResults}&q={query}',
                resultListLocator: 'result',
                resultTextLocator: 'cityName',//指定文本内容
                activeFirstItem  : true,
                align            : ALIGH,
                hotSource        : 'http://www.' + DOMAIN +'/go/rgn/trip/chinahotcity_jsonp.php'//不指定及没有热门推荐
            };
            cfg = S.merge(default_cfg , cfg);
            var acInstance = new Ac(cfg);
            var codeInputNode = acInstance.get('codeInputNode');
            codeInputNode =  codeInputNode instanceof  S.NodeList ? codeInputNode : S.one(codeInputNode);
            codeInputNode &&  acInstance.on('select' , function (e){
                codeInputNode.val(e.result.raw.cityCode);
            });
            return acInstance;
        }
    };
}, {requires: ['gallery/autocomplete/1.1/index' , './common', 'node' , 'event' , 'base']});
/**
 * RadioButton组件
 *
 * @module Radiobutton
 * @submodule
 **/
KISSY.add('gallery/tsearch/1.1/build/tradio',function (S) {
    /**
     * Radiobutton
     * @class Radiobutton
     * @extends S.Base
     * @uses
     * @constructor
     * @param {Object} 配置项
     **/
    function Radiobutton() {
        Radiobutton.superclass.constructor.apply(this, arguments);
        this.initializer();
    }
    S.extend(Radiobutton, S.Base, {
        initializer: function () {
            var node = this.node = this.get('node');
            var that = this;
            this.items = {};
            this.radios = node.all('input');
            this.radios.each(function (_item) {
                var item = {
                    input: _item
                };
                item.label = _item.parent('label');
                that.items[_item.val()] = item;
            });
            this.bindUI();
            this.set('value' , this.val());
        },
        bindUI     : function () {
            this.node.delegate('click', 'label', function (e) {
                var target = S.one(e.currentTarget);
                var radioInput =  target.one('input');
                radioInput.prop('checked' , true);
                this.set('value' , radioInput.val());
            },  this);
            this.on('afterValueChange' , this._syncUI , this);
        },
        _syncUI     : function (e) {
            var items = this.items;
            var next_item = items[e.newVal];
            var prev_item = items[e.prevVal];
            var SELECTED_CLASS = this.get('selectedClass');
            if (prev_item) {
                prev_item.label.removeClass(SELECTED_CLASS);
            }
            if (next_item) {
                next_item.label.addClass(SELECTED_CLASS);
            }
        },
        /**
         * 获取和设置radio的值
         *
         * @method val
         * @returns {*}
         */
        val : function (){
            if (arguments.length < 1) {
                return this._getValue();
            }else{
                return this._setValue.apply(this,arguments);
            }
        },
        _getValue   : function () {
            var checkedNode = this.node.one('input:checked');
            return checkedNode ? checkedNode.val() : undefined;
        },
        _setValue   : function (val) {
            var item = this.items[val];
            if (item) {
                item.input.attr('checked', true);
                this.set('value' , val);
            }
        }

    }, {
        ATTRS:{
            /**
             * Required radiobutton所在的父容器节点
             * @attribute node
             * @type NodeList
             * @default null
             **/
            node:{
                value:'',
                setter: function (val){
                    if (val instanceof S.NodeList) {
                        return val;
                    }else{
                        return S.one(val);
                    }
                }
            },
            /**
             * Required 输入框的name属性值, 将以此值去获取input节点
             * @attribute name
             * @type String
             * @default null
             **/
            name:{
                value:''
            },
            /**
             * 输入框选中时的ClassName
             * @attribute selectedClass
             * @type String
             * @default selected
             **/
            selectedClass:{
                value:'selected'
            },
            /**
             * 当前的checked为true的radio的值
             * @attribute value
             * @type String
             * @default null
             **/
            value : {
                value : null
            }

        }
    });
    return Radiobutton;
}, {requires: ['node' , 'event' , 'base' , 'sizzle']});
/*! tsearch - v1.1 - 2013-08-23 3:56:59 PM
* Copyright (c) 2013 舒克; Licensed  */
KISSY.add("gallery/tsearch/1.1/common",function(){var a={subString:function(a,b){var c=/[^\x00-\xff]/g;if(!a)return"";if(a.replace(c,"mm").length<=b)return a;for(var d=Math.floor(b/2),e=d;e<a.length;e++)if(a.substr(0,e).replace(c,"mm").length>=b)return a.substr(0,e);return a},stringLen:function(a){return a?a.replace(/[^\x00-\xff]/g,"rr").length:""},cutStr:function(b,c,d){return d=d||"...",a.stringLen(b)>c?a.subString(b,c-4)+d:b},buildObjCutAttr:function(b,c,d){b[c+"_sub"]=a.cutStr(b[c],d)},singleDateToDouble:function(a){return a.toString().length>1?a.toString():"0"+a.toString()},strToDate:function(a){var b=a.split("-");return new Date(b[0],b[1]-1,b[2])},getDateInterval:function(b,c){return parseInt(Math.abs(a.strToDate(c)-a.strToDate(b))/1e3/60/60/24)},formatDate:function(b){var c=new Date(b),d=a.singleDateToDouble,e=c.getFullYear(),f=d(c.getMonth()+1),g=d(c.getDate()),h=d(c.getHours()),i=d(c.getMinutes());return{mmdd:f+"-"+g,yymmdd:e+"-"+f+"-"+g,hhMM:h+":"+i,yy:e,mm:f,dd:g,hh:h,MM:i}},setDate:function(a,b){return new Date(a.getTime()+864e5*b)},timeToDuration:function(a){a/=1e3;var b=Math.floor(a/3600),c=Math.floor((a-3600*b)/60),d=a%60;return{h:b,s:c,m:d}},html2text:function(a){var b=document.createElement("div");b.innerHTML=a;try{return"string"==typeof b.innerText?b.innerText:b.textContent}catch(c){return a}}};return a}),KISSY.add("gallery/tsearch/1.1/trip-autocomplete",function(a,b,c){var d={node:null,points:["bl","tl"],overflow:{adjustX:!1,adjustY:!0}},e=location.href.indexOf("ac-daily")>-1?"daily.taobao.net":"taobao.com";return{flight:function(c){var f={source:"http://s.jipiao.trip."+e+"/city_search.do?lines={maxResults}&q={query}",resultListLocator:function(b){b=b.result;var c=[];return a.each(b,function(b){if(b.hasAirport)c.push(b);else{var d=b.nearCity;a.each(d,function(d){var e=a.mix(d,{nearCity:b.cityName});c.push(e)})}}),c},resultTextLocator:"cityName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/chinahotcity_jsonp.php",resultFormatter:function(b,c){var d=[],e='<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityname}</span><span class="ks-ac-intro">{py}</span></div>',f="";for(var g in c){var h=c[g];if(h.raw.nearCity){var i='<div class="ks-ac-item"><div class="ks-ac-near-tip">"'+h.raw.nearCity+'"&nbsp;\u6ca1\u6709\u673a\u573a</div>',j='<div class="ks-ac-item-inner ks-ac-item-inner-sub"><span class="ks-ac-name">\u90bb\u8fd1\u673a\u573a\uff1a{cityName}&nbsp;--&nbsp;\u8ddd\u79bb{distance}\u516c\u91cc</span></div>',k=a.substitute(j,{cityName:h.text,distance:h.raw.distance});h.raw.nearCity!=f?(i+=k+"</div>",f=h.raw.nearCity):i=k,d.push(i)}else d.push(a.substitute(e,{cityname:h.text,py:h.raw.py}))}return d}};c=a.merge(f,c);var g=new b(c),h=g.get("codeInputNode");return h=h instanceof a.NodeList?h:a.one(h),h&&g.on("select",function(a){h.val(a.result.raw.cityCode)}),g},iflight:function(c){var f={source:"http://ijipiao.trip."+e+"/ie/remote/auto_complete.do?flag=4&count=10&callback={callback}&q={query}",resultListLocator:"result",resultTextLocator:"cityName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/international_jsonp.php"};c=a.merge(f,c);var g=new b(c),h=g.get("codeInputNode");return h=h instanceof a.NodeList?h:a.one(h),h&&g.on("select",function(a){h.val(a.result.raw.cityCode)}),g},hotel:function(f){function g(b){var c=b.result,d=[];return a.isArray(c)&&c.length&&a.map(c,function(a){var b=a.t.split("_");d.push({cityName:b[0],cityCode:a.c,py:b[1]})}),d}function h(b,d){return a.map(d,function(b){var d=b.raw;return a.substitute('<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityName}</span><span class="ks-ac-intro">{py}</span></div>',{cityName:c.cutStr(d.cityName,20),py:c.cutStr(d.py,10)})})}var i={activeFirstItem:!0,align:d,resultListLocator:g,resultFormatter:h,resultTextLocator:"cityName",source:"http://kezhan.trip."+e+"/citysuggest.do?t=0&q={query}",hotSource:"http://www."+e+"/go/rgn/trip/hotelhotcityv2_jsonp.php"};f=a.merge(i,f);var j=new b(f),k=j.get("codeInputNode");return k=k instanceof a.NodeList?k:a.one(k),k&&j.on("select",function(a){k.val(a.result.raw.cityCode)}),j},travel:function(c){function f(a){return a}function g(b,c){return a.map(c,function(c){var c=c.raw,d=c.cityName.split("-");return a.substitute(i,{first:f(d[0],b),second:f(d[1],b)?"&nbsp;-&nbsp;"+f(d[1],b):""})})}var h=document.domain.indexOf("daily.taobao.net")>1,i='<div class="ks-ac-item-inner"><span class="ks-ac-name">{first}</span><span class="ks-ac-intro" style="color:#999;float:left;">{second}</span></div>';_dep_citycodeUrl=(h?"http://dujia.trip.daily.taobao.net/":"http://dujia.trip."+e+"/")+"sell/ajax/get_sug_city.htm?max=10";var j={activeFirstItem:!0,align:d,resultListLocator:"result",resultTextLocator:"cityName",resultFormatter:g,source:_dep_citycodeUrl+"&q={query}",hotSource:"http://www."+e+"/go/rgn/trip/dujiadephotcity_jsonp.php"};c=a.merge(j,c);var k=new b(c),l=k.get("codeInputNode");return l=l instanceof a.NodeList?l:a.one(l),l&&k.on("select",function(a){l.val(a.result.raw.cityCode)}),k},train:function(c){var f={source:"http://s.train.trip."+e+"/station_suggestion.htm?lines={maxResults}&callback={callback}&q={query}",resultListLocator:"results",resultTextLocator:"stationName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/chinahotcity_jsonp.php"};c=a.merge(f,c);var g=new b(c);return g},city:function(c){var f={source:"http://s.jipiao.trip."+e+"/city_search.do?lines={maxResults}&q={query}",resultListLocator:"result",resultTextLocator:"cityName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/chinahotcity_jsonp.php"};c=a.merge(f,c);var g=new b(c),h=g.get("codeInputNode");return h=h instanceof a.NodeList?h:a.one(h),h&&g.on("select",function(a){h.val(a.result.raw.cityCode)}),g}}},{requires:["gallery/autocomplete/1.1/index","./common","node","event","base"]}),KISSY.add("gallery/tsearch/1.1/tradio",function(a){function b(){b.superclass.constructor.apply(this,arguments),this.initializer()}return a.extend(b,a.Base,{initializer:function(){var a=this.node=this.get("node"),b=this;this.items={},this.radios=a.all("input"),this.radios.each(function(a){var c={input:a};c.label=a.parent("label"),b.items[a.val()]=c}),this.bindUI(),this.set("value",this.val())},bindUI:function(){this.node.delegate("click","label",function(b){var c=a.one(b.currentTarget),d=c.one("input");d.prop("checked",!0),this.set("value",d.val())},this),this.on("afterValueChange",this._syncUI,this)},_syncUI:function(a){var b=this.items,c=b[a.newVal],d=b[a.prevVal],e=this.get("selectedClass");d&&d.label.removeClass(e),c&&c.label.addClass(e)},val:function(){return arguments.length<1?this._getValue():this._setValue.apply(this,arguments)},_getValue:function(){var a=this.node.one("input:checked");return a?a.val():void 0},_setValue:function(a){var b=this.items[a];b&&(b.input.attr("checked",!0),this.set("value",a))}},{ATTRS:{node:{value:"",setter:function(b){return b instanceof a.NodeList?b:a.one(b)}},name:{value:""},selectedClass:{value:"selected"},value:{value:null}}}),b},{requires:["node","event","base","sizzle"]}),KISSY.add("gallery/tsearch/1.1/tsearch",function(a,b,c,d,e,f,g){function h(a){var b=this;h.superclass.constructor.call(b,a),this.initializer()}var i={TripAutocomplete:c,Calendar:e,Placeholder:f,Tradio:d};return a.extend(h,b,{initializer:function(){return this.form=this.get("form"),this.form?(this.fields=this.get("fields"),a.each(this.fields,function(b,c){var d=this.form.one(c);return d?(b.node=d,b.val&&b.node.val(b.val),this.bindWidgets(b),b.autoSwitch&&this.setSwitchInput(c),void 0):(a.log(c+"is not find.."),!1)},this),this.bindEvent(),this.get("storage")&&this._restoreStorageValue(),void 0):(a.log("TSearch:\u6ca1\u6709\u627e\u5230\u8868\u5355\u8282\u70b9,\u521d\u59cb\u5316\u5931\u8d25"),void 0)},bindEvent:function(){this.form.on("submit",this._doSubmit,this),this.get("switchSearchType")&&this.initRadioSwitch();var b=this.get("swapper");b&&a.Event.on(this.form.all(b.trigger),"click",function(a){a.preventDefault(),this.swap()},this)},addField:function(){},bindWidgets:function(b){var c=this;a.each(b.widgets,function(d,e){var f=i[e],g="";if(f&&("TripAutocomplete"==e?(a.each(b.widgets[e],function(a,d){a.inputNode=a.inputNode&&c.form.one(a.inputNode),a.codeInputNode=a.codeInputNode&&c.form.one(a.codeInputNode),b[e]=f[d](a)}),b.showTip=function(a){b.node[0].focus(),b.TripAutocomplete.showMessage(a)}):(d.node&&(d.node=c.form.one(d.node)),d.triggerNode&&(d.triggerNode=c.form.one(d.triggerNode)),g=d.finalTriggerNode,d.finalTriggerNode&&(d.finalTriggerNode=c.form.one(d.finalTriggerNode)),b[e]=new f(d)),"Calendar"===e)){b.showTip=function(a){b.node[0].focus(),b.Calendar.set("message",a),b.Calendar.showMessage(a)};var h=c.fields[g];d.finalTriggerNode&&h&&(h[e]=b[e],h.showTip=function(a){h.node[0].focus(),h.Calendar.set("message",a),h.Calendar.showMessage(a)})}})},swap:function(){a.each(this.get("swapper").list,function(a,b){this._swapItem(b,a)},this)},_swapItem:function(a,b){var c;a=this.fields[a],b=this.fields[b],c=a.node.val(),a.node.val(b.node.val()),b.node.val(c)},setSwitchInput:function(b){var c=this.fields,d=c[b],e=function(){var b=c[d.autoSwitch.nextField],e=b.node;return e?(b.disabled||""!=b.node.val()||setTimeout(function(){e[0].focus()},200),void 0):(a.log("\u6ca1\u6709\u6307\u5b9a\u81ea\u52a8\u5207\u6362\u7684\u76ee\u6807\u5143\u7d20"),this)};return d.TripAutocomplete?d.TripAutocomplete.on("select",e):d.Calendar&&d.Calendar.on("dateclick",function(){this.currentNode.hasClass(b.replace(".",""))&&e()}),this},initRadioSwitch:function(){var a=this.get("switchSearchType"),b=this.fields,c=(this.form.one(a.back_container),b[a.back_input].node),d=b[a.trigger].Tradio,e=b[a.go_input].Calendar;return d?(d.on("afterValueChange",function(a){"0"===a.newVal&&(c.val(""),e.currentNode=c,e._setDateInfo("")),this._setSearchType(a.newVal)},this),c.on("valuechange",function(a){""===a.newVal&&d.val("0")}),e.on("dateclick",function(){this.currentNode.hasClass("J_EndDate")&&d.val("1")}),this._setSearchType(d.val()),void 0):this},_setSearchType:function(a){var b=this.get("switchSearchType"),c=this.fields,d=this.form.one(b.back_container);"1"===a?(d.removeClass("disabled"),c[b.go_input].autoSwitch&&(c[b.back_input].disabled=!1)):(d.addClass("disabled"),c[b.go_input].autoSwitch&&(c[b.back_input].disabled=!0))},_doSubmit:function(a){return this.validate()?(this.fire("submit",{form:this.form,fields:this.fields,srcEvent:a}),this.get("storage")&&this._storageForm(),void 0):(a.preventDefault(),!1)},_storageForm:function(){var b=this.get("fields"),c=[],d="";if(a.each(b,function(a,b){var e=a.node,f="",g="";e.hasAttr("type")?(f=e.attr("type"),g=e.val(),("text"==f||"hidden"==f)&&(""==e.val()||e.attr("disabled")||(d=b+":"+g,c.push(d)))):b.indexOf("J_Radio")>-1&&(d=b+":"+a.Tradio.val(),c.push(d))}),this.form.hasAttr("id")){var e=new g;e.setItem(this.form.attr("id"),c.join(","))}},_restoreStorageValue:function(){var b=new g,c=this.get("fields"),d="";this.form.hasAttr("id")&&b.getItem(this.form.attr("id"))&&(d=b.getItem(this.form.attr("id"))),a.each(d.split(","),function(a){var b;a=a.split(":");var d=a[1];(b=c[a[0]])&&(a[0].indexOf("J_Radio")>-1?b.Tradio&&b.Tradio.val(a[1]):(a[0].indexOf("J_DepDate")>-1?(d=a[1],this._isResetDate(a[1])&&(d=this.getDate(1))):a[0].indexOf("J_EndDate")>-1&&(d=a[1],this._isResetDate(a[1])&&(d=this.getDate(2))),b.node.val(d)))},this)},_isResetDate:function(a){return a=a.split("-"),this.get("time")>new Date(a[0],a[1]-1,a[2])},getDate:function(a){function b(a){return a+="",1==a.length?"0"+a:a}a=a||0;var c,d,e,f=this.get("time");return f.setDate(f.getDate()+a),c=f.getFullYear(),d=b(f.getMonth()+1),e=b(f.getDate()),[c,d,e].join("-")},validate:function(){var a,b,c,d,e,f,g,h=this.fields,i=this,j=!0;for(b=0,d=this.get("validation_order"),e=d.length;e>b&&(a=d[b],h[a].validation&&j&&!h[a].disabled);b++){for(c=0,f=h[a].validation,g=f.length;g>c;c++){var k=f[c];if(!i._validateRule(k,h[a])){i.fire("validate",{rule:k,field:h[a]}),"function"==typeof k.onValidateFailure?k.onValidateFailure.call(h[a],k):h[a].showTip&&h[a].showTip(k.tip),j=!1;break}}if(0==j)break}return j},_validateRule:function(a,b){var c=function(a){var b=a.split("-");return new Date(b[0],b[1]-1,b[2])};switch(a.type){case"required":return""!=b.node.val();case"dateformat":var d=b.node.val();return 10==d.length&&/(([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))-02-29)/.test(d);case"mindate":var e,d=b.node.val(),f=c(d);return e="string"==typeof a.minDate?c(this.fields[a.minDate].node.val()):a.minDate,f>=e;case"identical":var d=b.node.val(),g=this.fields[a.identicalWidth];return d!=g.node.val();case"custom":return"function"==typeof a.validateFn?a.validateFn.call(b,a.arg,this):!0}return!0}},{ATTRS:{form:{value:"",setter:function(b){return b instanceof a.NodeList?b:a.one(b)}},fields:{value:{"#J_FlightDepCity":{input_node:null,widgets:{Placeholder:{inputNode:null},TripAutocompleteV2:{}},validation:[{blur:[{required:""}]}]}}},validate_order:{value:[]},swapper:{value:{trigger:"#J_Pi_Search_FlightSwap",children:{from:"to"}}},switchSearchType:{value:null},storage:{value:!1},validation_order:{value:null},time:{value:new Date}}}),h},{requires:["base","./trip-autocomplete","./tradio","gallery/calendar/1.1/index","gallery/placeholder/1.0/index","gallery/offline/1.1/index","./common","node","base"]});

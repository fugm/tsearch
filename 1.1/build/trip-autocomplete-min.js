/*! tsearch - v1.1 - 2013-09-02 3:55:12 PM
* Copyright (c) 2013 舒克; Licensed  */
KISSY.add("gallery/tsearch/1.1/common",function(){var a={subString:function(a,b){var c=/[^\x00-\xff]/g;if(!a)return"";if(a.replace(c,"mm").length<=b)return a;for(var d=Math.floor(b/2),e=d;e<a.length;e++)if(a.substr(0,e).replace(c,"mm").length>=b)return a.substr(0,e);return a},stringLen:function(a){return a?a.replace(/[^\x00-\xff]/g,"rr").length:""},cutStr:function(b,c,d){return d=d||"...",a.stringLen(b)>c?a.subString(b,c-4)+d:b},buildObjCutAttr:function(b,c,d){b[c+"_sub"]=a.cutStr(b[c],d)},singleDateToDouble:function(a){return a.toString().length>1?a.toString():"0"+a.toString()},strToDate:function(a){var b=a.split("-");return new Date(b[0],b[1]-1,b[2])},getDateInterval:function(b,c){return parseInt(Math.abs(a.strToDate(c)-a.strToDate(b))/1e3/60/60/24)},formatDate:function(b){var c=new Date(b),d=a.singleDateToDouble,e=c.getFullYear(),f=d(c.getMonth()+1),g=d(c.getDate()),h=d(c.getHours()),i=d(c.getMinutes());return{mmdd:f+"-"+g,yymmdd:e+"-"+f+"-"+g,hhMM:h+":"+i,yy:e,mm:f,dd:g,hh:h,MM:i}},setDate:function(a,b){return new Date(a.getTime()+864e5*b)},timeToDuration:function(a){a/=1e3;var b=Math.floor(a/3600),c=Math.floor((a-3600*b)/60),d=a%60;return{h:b,s:c,m:d}},html2text:function(a){var b=document.createElement("div");b.innerHTML=a;try{return"string"==typeof b.innerText?b.innerText:b.textContent}catch(c){return a}}};return a}),KISSY.add("gallery/tsearch/1.1/trip-autocomplete",function(a,b,c){var d={node:null,points:["bl","tl"],overflow:{adjustX:!1,adjustY:!0}},e=location.href.indexOf("ac-daily")>-1?"daily.taobao.net":"taobao.com";return{flight:function(c){var f={source:"http://s.jipiao.trip."+e+"/city_search.do?lines={maxResults}&q={query}",resultListLocator:function(b){b=b.result;var c=[];return a.each(b,function(b){if(b.hasAirport)c.push(b);else{var d=b.nearCity;a.each(d,function(d){var e=a.mix(d,{nearCity:b.cityName});c.push(e)})}}),c},resultTextLocator:"cityName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/chinahotcity_jsonp.php",resultFormatter:function(b,c){var d=[],e='<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityname}</span><span class="ks-ac-intro">{py}</span></div>',f="";for(var g in c){var h=c[g];if(h.raw.nearCity){var i='<div class="ks-ac-item"><div class="ks-ac-near-tip">"'+h.raw.nearCity+'"&nbsp;\u6ca1\u6709\u673a\u573a</div>',j='<div class="ks-ac-item-inner ks-ac-item-inner-sub"><span class="ks-ac-name">\u90bb\u8fd1\u673a\u573a\uff1a{cityName}&nbsp;--&nbsp;\u8ddd\u79bb{distance}\u516c\u91cc</span></div>',k=a.substitute(j,{cityName:h.text,distance:h.raw.distance});h.raw.nearCity!=f?(i+=k+"</div>",f=h.raw.nearCity):i=k,d.push(i)}else d.push(a.substitute(e,{cityname:h.text,py:h.raw.py}))}return d}};c=a.merge(f,c);var g=new b(c),h=g.get("codeInputNode");return h=h instanceof a.NodeList?h:a.one(h),h&&g.on("select",function(a){h.val(a.result.raw.cityCode)}),g},iflight:function(c){var f={source:"http://ijipiao.trip."+e+"/ie/remote/auto_complete.do?flag=4&count=10&callback={callback}&q={query}",resultListLocator:"result",resultTextLocator:"cityName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/international_jsonp.php"};c=a.merge(f,c);var g=new b(c),h=g.get("codeInputNode");return h=h instanceof a.NodeList?h:a.one(h),h&&g.on("select",function(a){h.val(a.result.raw.cityCode)}),g},hotel:function(f){function g(b){var c=b.result,d=[];return a.isArray(c)&&c.length&&a.map(c,function(a){var b=a.t.split("_");d.push({cityName:b[0],cityCode:a.c,py:b[1]})}),d}function h(b,d){return a.map(d,function(b){var d=b.raw;return a.substitute('<div class="ks-ac-item-inner"><span class="ks-ac-name">{cityName}</span><span class="ks-ac-intro">{py}</span></div>',{cityName:c.cutStr(d.cityName,20),py:c.cutStr(d.py,10)})})}var i={activeFirstItem:!0,align:d,resultListLocator:g,resultFormatter:h,resultTextLocator:"cityName",source:"http://kezhan.trip."+e+"/citysuggest.do?t=0&q={query}",hotSource:"http://www."+e+"/go/rgn/trip/hotelhotcityv2_jsonp.php"};f=a.merge(i,f);var j=new b(f),k=j.get("codeInputNode");return k=k instanceof a.NodeList?k:a.one(k),k&&j.on("select",function(a){k.val(a.result.raw.cityCode)}),j},travel:function(c){function f(a){return a}function g(b,c){return a.map(c,function(c){var c=c.raw,d=c.cityName.split("-");return a.substitute(i,{first:f(d[0],b),second:f(d[1],b)?"&nbsp;-&nbsp;"+f(d[1],b):""})})}var h=document.domain.indexOf("daily.taobao.net")>1,i='<div class="ks-ac-item-inner"><span class="ks-ac-name">{first}</span><span class="ks-ac-intro" style="color:#999;float:left;">{second}</span></div>';_dep_citycodeUrl=(h?"http://dujia.trip.daily.taobao.net/":"http://dujia.trip."+e+"/")+"sell/ajax/get_sug_city.htm?max=10";var j={activeFirstItem:!0,align:d,resultListLocator:"result",resultTextLocator:"cityName",resultFormatter:g,source:_dep_citycodeUrl+"&q={query}",hotSource:"http://www."+e+"/go/rgn/trip/dujiadephotcity_jsonp.php"};c=a.merge(j,c);var k=new b(c),l=k.get("codeInputNode");return l=l instanceof a.NodeList?l:a.one(l),l&&k.on("select",function(a){l.val(a.result.raw.cityCode)}),k},train:function(c){var f={source:"http://s.train.trip."+e+"/station_suggestion.htm?lines={maxResults}&callback={callback}&q={query}",resultListLocator:"results",resultTextLocator:"stationName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/chinahotcity_jsonp.php"};c=a.merge(f,c);var g=new b(c);return g},city:function(c){var f={source:"http://s.jipiao.trip."+e+"/city_search.do?lines={maxResults}&q={query}",resultListLocator:"result",resultTextLocator:"cityName",activeFirstItem:!0,align:d,hotSource:"http://www."+e+"/go/rgn/trip/chinahotcity_jsonp.php"};c=a.merge(f,c);var g=new b(c),h=g.get("codeInputNode");return h=h instanceof a.NodeList?h:a.one(h),h&&g.on("select",function(a){h.val(a.result.raw.cityCode)}),g}}},{requires:["gallery/autocomplete/1.1/index","./common","node","event","base"]});
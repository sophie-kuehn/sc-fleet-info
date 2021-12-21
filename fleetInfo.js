$(function () {
    'use strict';
    let pledges = [];
    let skins = {};

    const INSURANCE_TYPE_LTI = 'lti';
    const INSURANCE_TYPE_IAE = 'iae';
    const INSURANCE_TYPE_MONTHLY = 'monthly';

    const _manufacturerShortMap = {
        'ANVL': ['Anvil Aerospace', 'Anvil'],
        'AEGS': ['Aegis Dynamics', 'Aegis'],
        'AOPOA': ['Aopoa'],
        'ARGO': ['ARGO Astronautics', 'ARGO'],
        'BANU': ['Banu'],
        'CNOU': ['Consolidated Outland', 'Consolidated', 'C.O.'],
        'CRSD': ['Crusader Industries', 'Crusader'],
        'DRAK': ['Drake Interplanetary', 'Drake'],
        'ESPERIA': ['Esperia'],
        'ESPR': ['Esperia'],
        'GRIN': ['Greycat Industrial', 'Greycat'],
        'KRGR': ['Kruger Intergalactic', 'Kruger'],
        'MISC': ['MISC', 'Musashi Industrial & Starflight Concern', 'M.I.S.C.'],
        'ORIG': ['Origin Jumpworks', 'Origin Jumpworks GmbH', 'Origin'],
        'RSI': ['Roberts Space Industries', 'RSI', 'R.S.I.'],
        'TMBL': ['Tumbril'],
        'VANDUUL': ['Vanduul'],
        'XIAN': ['Xi\'an'],
    };

    const _altShipNames = {
        'Mercury Star Runner': ['Star Runner'],
        'GRIN ROC DS': ['ROC'],
        '100i': ['100 series'],
        '125a': ['100 series'],
        '135c': ['100 series']
    };

    const _doStrictSkinSearch = {
        'Sabre Raven': true,
        'Hull D': true
    };

    const createPledge = function($pledge, name, model, manufacturer, insuranceType, insuranceDuration, gamePackage, image)
    {
        if (image == undefined) {
            image = $('div.image', $pledge).css('background-image');
        }

        let pledge = {
            id: $('.js-pledge-id', $pledge).val(),
            insurance_type: insuranceType,
            insurance_duration: insuranceDuration,
            package_id: $('.js-pledge-id', $pledge).val(),
            pledge: $('.js-pledge-name', $pledge).val(),
            image: image,
            gamePackage: gamePackage,
            name: name,
            manufacturerNames: _manufacturerShortMap[manufacturer] || [manufacturer]
        };

        $.each(pledge.manufacturerNames, function(mi, manufacturerName) {
            model = model.replace(new RegExp(manufacturerName, 'gi'), '');
        });

        model = model.replace(/\-/gi, '').trim();
        pledge.model = model;
        pledge.shortModel = model.split(' ')[0];
        pledge.altModelNames = _altShipNames[pledge.model] || []

        return pledge;
    };

    const processPledges = function(body) 
    {
        $('.list-items li', body).each((index, el) => {
            const $pledge = $(el);

            let gamePackage = false;
            let insurances = {};

            $pledge.find('.without-images .item .title').each((i, elBonus) => {
                let bonus = $(elBonus).text().trim();

                if (/Star\sCitizen\sDigital\sDownload/i.test(bonus)) {
                    gamePackage = true;

                } else if (/Lifetime\s+Insurance/i.test(bonus)) {
                    insurances.lti = true;

                } else if (/IAE\s+Insurance/i.test(bonus)) {
                    insurances.iae = true;

                } else {
                    let insuranceRegexResult = /(\d+)(\s+|-)Months?\s+Insurance/i.exec(bonus);
                    if (insuranceRegexResult !== null && insuranceRegexResult[1]) {
                        let duration = parseInt(insuranceRegexResult[1]);
                        if (duration > 0) insurances.monthly = duration;
                    }
                }
            });

            let insuranceType = null;
            let insuranceDuration = null;

            if (insurances.lti != undefined) {
                insuranceType = INSURANCE_TYPE_LTI;
            }
            else if (insurances.iae != undefined) {
                insuranceType = INSURANCE_TYPE_IAE;
                insuranceDuration = 120;
            }
            else if (insurances.monthly != undefined) {
                insuranceType = INSURANCE_TYPE_MONTHLY;
                insuranceDuration = insurances.monthly;
            }

            // browse the ships that are in "Also contains" part
            $pledge.find('.without-images .item .title').each((i, elBonus) => {
                const bonus = $(elBonus).text().trim();

                if (/Origin\s+G12[ar]/i.test(bonus)) {
                    const shipInfoRegexResult = /(Origin)\s+(G12[ar])/i.exec(bonus);
                    const pledge = createPledge(
                        $pledge,
                        '',
                        shipInfoRegexResult[2],
                        shipInfoRegexResult[1],
                        insuranceType,
                        insuranceDuration,
                        gamePackage
                    );

                    pledges.push(pledge);
                }
            });

            // browse the Ship items
            $('.items .item', $pledge).each((indexItem, elItem) => {
                const $item = $(elItem);
                let $shipInfo = $item;

                // skins
                if ($item.find('.kind:contains(Skin)').length !== 0 
                    || $item.find('.title:contains(Paint)').length !== 0
                ) {
                    let skinName = $('.title', $shipInfo).text();
                    if (skins[skinName] == undefined) skins[skinName] = 0;
                    skins[skinName] = skins[skinName] + 1;
                    console.log(skinName);
                    return;
                }

                // special cases
                if ($item.find('.kind:contains(Hangar decoration)').length !== 0) {
                    if ($('.liner', $shipInfo).text().indexOf('Greycat Industrial') !== -1
                        && $('.title', $shipInfo).text().indexOf('Greycat PTV') !== -1) {

                        // Found the ship "Greycat PTV" from "Greycat Industrial"
                        const pledge = createPledge(
                            $pledge,
                            '',
                            $('.title', $shipInfo).text(),
                            $('.liner span', $shipInfo).text(),
                            insuranceType,
                            insuranceDuration,
                            gamePackage
                        );

                        pledges.push(pledge);
                    }
                    return;
                }

                // ship
                if ($item.find('.kind:contains(Ship)').length !== 0) {
                    const pledge = createPledge(
                        $pledge,
                        $('.custom-name', $shipInfo).text(),
                        $('.title', $shipInfo).text(),
                        $('.liner span', $shipInfo).text(),
                        insuranceType,
                        insuranceDuration,
                        gamePackage,
                        $('div.image', $item).css('background-image')
                    );

                    pledges.push(pledge);
                }
            });
        })
    };

    const renderFleet = function(fleetList, fleetViewLink) 
    {
        fleetList.empty();
        let fleetViewLinkHref = "http://www.starship42.com/fleetview/?type=matrix";

        $.each(pledges, function(index, pledge) {
            console.log(pledge);

            fleetViewLinkHref = fleetViewLinkHref + "&s[]=" + pledge.model;

            let imageBox = $('<div></div>');
            imageBox.css('background-image', pledge.image);
            imageBox.css('background-size', 'cover');
            imageBox.css('background-position', 'center');
            imageBox.css('background-repeat', 'no-repeat');
            imageBox.css('height', '110px');

            let infoBox = $('<ul></ul>');
            infoBox.css('margin', '0');
            infoBox.css('padding', '0');
            let infoTemplate = $('<li></li>');
            infoTemplate.css('border-top', '1px solid rgb(29, 45, 66)');
            infoTemplate.css('padding', '3px 0');

            if (pledge.name.length > 0) {
                let nameBox = infoTemplate.clone();
                nameBox.css('border-top', 'none');
                nameBox.css('padding', '3px 0 0 0');
                nameBox.css('font-size', '1.2em');
                nameBox.css('color', '#fff');
                nameBox.text(pledge.name);
                infoBox.append(nameBox);
            }

            let modelBox = infoTemplate.clone();
            modelBox.css('border-top', 'none');
            modelBox.css('padding', '3px 0 0 0');

            if (pledge.name.length > 0) {
                modelBox.css('font-size', '0.9em');
            } else {
                modelBox.css('padding', '3px 0 0 0');
                modelBox.css('font-size', '1.2em');
            }

            modelBox.css('color', '#fff');
            modelBox.text(pledge.model);
            infoBox.append(modelBox);

            let manuBox = infoTemplate.clone();
            manuBox.css('border-top', 'none');
            manuBox.css('border-bottom', '3px solid rgb(29, 45, 66)');
            manuBox.css('padding', '0 0 6px 0');
            manuBox.css('font-size', '0.8em');
            manuBox.text(pledge.manufacturerNames[0]);
            infoBox.append(manuBox);

            if (pledge.gamePackage) {
                infoBox.append(infoTemplate.clone().text("Game Package"));
            }

            if (pledge.insurance_type == INSURANCE_TYPE_LTI) {
                infoBox.append(infoTemplate.clone().text("Life Time Insurance"));
            } else if (pledge.insurance_type != null) {
                infoBox.append(infoTemplate.clone().text(pledge.insurance_duration + " Month/s Insurance"));
            }

            $.each(skins, function(skinName, skinNumber) {
                let searchFor = pledge.shortModel;
                if (_doStrictSkinSearch[pledge.model] != undefined) searchFor = pledge.model;
                let append = (skinName.search(new RegExp(searchFor, "i")) != -1);

                // take care of naming mess
                $.each(pledge.altModelNames, function(ani, altName) {
                    if (skinName.search(new RegExp(altName, "i")) != -1) {
                        append = true;
                        return false;
                    }
                });

                // even bigger mess
                if ((append == true && skinName.search(new RegExp("Ares Radiance", "i")) != -1
                        && pledge.pledge.search(new RegExp("Radiance", "i")) == -1
                    )
                    || (append == true && skinName.search(new RegExp("Ares Ember", "i")) != -1
                        && pledge.pledge.search(new RegExp("Ember", "i")) == -1
                    )
                ) {
                    append = false;
                }

                if (append) {
                    skinName = skinName.replace(pledge.shortModel, "");
                    skinName = skinName.replace(pledge.model, "");
                    $.each(pledge.altModelNames, function(ani, altName) {
                        skinName = skinName.replace(new RegExp(altName, "i"), "");
                    });
                    $.each(pledge.manufacturerNames, function(mi, manufacturerName) {
                        skinName = skinName.replace(new RegExp(manufacturerName, "i"), "");
                    });
                    skinName = skinName.replace("-", "");
                    skinName = skinName.trim();
                    if (skinNumber > 1) skinName = skinName + " (" + skinNumber + ")";
                    infoBox.append(infoTemplate.clone().text(skinName));
                }
            });

            let inner = $('<div></div>');
            inner.css('background-color', 'rgba(23,29,37,0.5)');
            inner.css('padding', '10px');
            inner.css('margin', '5px');

            inner.append(imageBox);
            inner.append(infoBox);

            let newEntry = $('<div></div>');
            newEntry.css('width', '25%');
            newEntry.css('position', 'relative');
            newEntry.append(inner);
            fleetList.append(newEntry);
        });

        fleetViewLink.attr("href", fleetViewLinkHref);
    };

    let dataLoaded = false;
    const loadData = function(page, callback) 
    {
        if (dataLoaded) return callback();

        const url = '/account/pledges?page=' + page;
        const $page = $('<div>');
        $page.load(url + ' .page-wrapper', function (response, status) {
            if ($('.list-items .empy-list', this).length > 0) {
                dataLoaded = true;
                return callback();
            }
            processPledges(this);
            loadData(page+1, callback);
        });
    };

    const renderFleetPage = function() 
    {
        $('div.sidenav ul li').removeClass('active');
        $('.showFleetsButton').addClass('active');
        let top = $('<div class="top"></div>');

        let fleetViewLinkBox = $('<div></div>');
        $('.inner-content').append(fleetViewLinkBox);
        let fleetViewLink = $('<a href="" target="_blank" class="shadow-button trans-02s trans-color" style="padding:0;float:right;"><span class="label js-label trans-02s">show my fleet in 3D</span><span class="left-section"></span><span class="right-section"></span></a>');
        top.append(fleetViewLink);

        $('.inner-content').empty().css('box-sizing', 'inherit').append(top);
        let title = $('<h2 class="title">MY FLEET</h2>');
        top.append(title);

        let sep = $('<div style="clear:both" class="separator"></div>');
        top.append(sep);

        let fleetList = $('<div class="fleetList"></div>');
        fleetList.css('display', 'flex');
        fleetList.css('flex-wrap', 'wrap');
        fleetList.css('color', '#bdced4');
        fleetList.css('font-size', '0.8em');
        $('.inner-content').append(fleetList);

        loadData(1, function(){
            renderFleet(fleetList, fleetViewLink);
        });
    };

    let nav = $('div.sidenav ul li');
    if (nav.length > 0) {
        let newNav = $(nav[0]).clone();
        newNav.removeClass('active');
        newNav.addClass('showFleetsButton');
        newNav.find('.bg').text('MY FLEET');
        newNav.find('a').attr('href', 'javascript:void(0)');
        newNav.find('a').click(renderFleetPage);
        $('div.sidenav ul').prepend(newNav);
    }
});



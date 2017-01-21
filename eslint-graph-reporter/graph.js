/* global module, require, __dirname, process */

/**
 *
 * @author Matthieu Lassalvy
 *
 */
(function() {

    'use strict';

    var fs = require('fs'),
        cwd = process.cwd(),
        path = require('path'),
        fse = require('fs-extra'),
        lodash = require('lodash'),
        itemTemplate = 'html-graph-item',
        reportTemplate = 'html-graph-report';

    /* ----------------------------------------------

    Helpers

    ---------------------------------------------- */

    /**
     *
     * Load eslint graph plugin HTML template
     *
     */
    function _loadHTMLTemplate (filename) {
        var tpl = path.join(__dirname, filename + '.html');
        tpl = fs.readFileSync(tpl, 'utf-8');
        tpl = lodash.template(tpl);
        return tpl;
    }

    /**
     *
     * Return a zero month padded
     *
     */
    function _getPadDay (date) {
        var day = date.getDate();
        day = (day < 10) ? '0' + day : day;
        return String(day);
    }

    function _getPadHours (date) {
        var hours = date.getHours();
        hours = (hours < 10) ? '0' + hours : hours;
        return String(hours);
    }

    function _getPadSeconds (date) {
        var seconds = date.getSeconds();
        seconds = (seconds < 10) ? '0' + seconds : seconds;
        return String(seconds);
    }

    function _getPadMinutes (date) {
        var mins = date.getSeconds();
        mins = (mins < 10) ? '0' + mins : mins;
        return String(mins);
    }

    function _getPadMonth (date) {
        var month = (date.getMonth() + 1);
        month = (month < 10) ? '0' + month : month;
        return String(month);
    }

    /**
     *
     * Calculate max percent for graphs
     * Combinate errors and warnings for each report in stats file
     *
     */
    function _getMaxErrors (stats) {
        var count,
            max = 0;
        lodash.map(stats, function(obj) {
            count = obj.warnings + obj.errors;
            if (count > max) {
                max = count;
            }
        });
        return max;
    }

    /**
     *
     * Write stats file in reports folder
     *
     */
    function _writeStatsFile (stats, filename) {
        var file = path.join(cwd, 'reports', filename);
        fse.writeJsonSync(file, stats, {
            spaces: 2
        });
    }

    /**
     *
     * Load stats file in reports folder
     *
     */
    function _loadStatsFile (filename) {
        var stats = {},
            file = path.join(cwd, 'reports', filename);
        try {
            stats = fse.readJsonSync(file);

        } catch (e) {
            _writeStatsFile(stats, filename);

        }
        return stats;
    }

    /*
    function _reverseGraphs (graphs) {
        var keys = Object.keys(graphs);
        console.log('keys', keys);
        keys = keys.reverse();
        console.log('keys', keys);
    }
    */

    /* ----------------------------------------------

    Templates

    ---------------------------------------------- */

    /**
     * Given a word and a count, append an s if count is not one.
     * @param {string} word A word in its singular form.
     * @param {int} count A number controlling whether word should be pluralized.
     * @returns {string} The original word with an s on the end if count is not one.
     */
    /*
    function pluralize (word, count) {
        return (count === 1 ? word : word + 's');
    }
    */

    /**
     * @param {Array} results Test results.
     * @returns {string} HTML string describing the results.
     */
    function _renderResults (stats, max) {
        var left, percent, count,
            index = 0,
            width = 60,
            template = _loadHTMLTemplate(itemTemplate);
        return lodash.map(stats, function(obj) {
            left = (width * index);
            count = obj.warnings + obj.errors;
            percent = ((100 * count) / max);
            index++;
            return template({
                left: left,
                top: 100 - percent,
                errors: obj.errors,
                warnings: obj.warnings,
                errorsPercent: ((100 * obj.errors) / count),
                warningsPercent: ((100 * obj.warnings) / count)
            });
        })
        .join('\n');
    }

    /* ----------------------------------------------

    Public Interface

    ---------------------------------------------- */

    function eslintGraphReporter (results) {
        var reportKey, data, output, template, max, graphs,
            date = new Date(),
            json = 'eslint-graph.json',
            stats = _loadStatsFile(json);

        reportKey = String(date.getFullYear()) + _getPadMonth(date);
        reportKey += _getPadDay(date) + '_' + _getPadHours(date);
        reportKey += _getPadMinutes(date) + _getPadSeconds(date);

        // write current report
        data = {
            errors: 0,
            warnings: 0
        };
        results.forEach(function(result) {
            data.errors += result.errorCount;
            data.warnings += result.warningCount;
        });
        stats[reportKey] = data;
        _writeStatsFile(stats, json);

        // max errors for percentage
        max = _getMaxErrors(stats);

        // load template
        template = _loadHTMLTemplate(reportTemplate);
        graphs = _renderResults(stats, max);
        output = template({
            date: new Date(),
            results: graphs
        });
        return output;
    }

    module.exports = eslintGraphReporter;

}());

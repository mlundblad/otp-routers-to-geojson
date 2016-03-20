#!/usr/bin/env gjs

const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;

function getPolygon(routerInfo) {
    let coords = [];
    if (routerInfo.polygon.coordinates[0].length > 2) {
	routerInfo.polygon.coordinates[0].forEach(function(coordinate) {
	    coords.push([coordinate[0], coordinate[1]]);
	});
	coords.push([routerInfo.polygon.coordinates[0][0][0],
		     routerInfo.polygon.coordinates[0][0][1]]);
    
	return coords;
    } else {
	return null;
    }
}

function routerInfoToFeature(routerInfo) {
    let coords = getPolygon(routerInfo);

    if (coords) {
	let feature = {type: 'Feature',
		       properties: {name: routerInfo.routerId},
		       geometry: {
			   type: 'Polygon',
			   coordinates: [getPolygon(routerInfo)]}};
	return feature;
    } else {
	/* TODO: if there's only two coords, should we treat them as
	   a bounding box? */
	return null;
    }
}

function parseOutput(json) {
    let collection = {type: 'FeatureCollection',
		      features: []};
    json.routerInfo.forEach(function(routerInfo) {
	let feature = routerInfoToFeature(routerInfo);

	if (feature)
	    collection.features.push(feature);
    });

    return collection;
}

function main(args) {
    let url = args[0] + '/routers';
    let uri = new Soup.URI(url);
    let session = new Soup.Session();
    let request = new Soup.Message({ method: 'GET', uri: uri });

    request.request_headers.append('Accept', 'application/json');

    if (session.send_message(request) === 200) {
	try {
	    let json = JSON.parse(request.response_body.data);
	    let doc = parseOutput(json);
	    print(JSON.stringify(doc));
	} catch (e) {
	    log('Failed to parse JSON');
	}
    } else {
	log('Failed to read from OTP');
    }
}

main(ARGV);

import React from 'react';
import { GoogleMapView, GoogleMapViewProps } from './GoogleMapView';

export type LeafletMapProps = GoogleMapViewProps;

/**
 * LeafletMap backwards-compatible wrapper that now renders the modern Google Maps Platform
 * integration via @vis.gl/react-google-maps.
 */
export const LeafletMap: React.FC<LeafletMapProps> = (props) => {
  return <GoogleMapView {...props} />;
};

export default LeafletMap;

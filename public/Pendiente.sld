<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" version="1.0.0">
  <UserLayer>
    <sld:LayerFeatureConstraints>
      <sld:FeatureTypeConstraint/>
    </sld:LayerFeatureConstraints>
    <sld:UserStyle>
      <sld:Name>Pendiente</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:RasterSymbolizer>
            <sld:Opacity>0.6</sld:Opacity>
            <sld:ChannelSelection>
              <sld:GrayChannel>
                <sld:SourceChannelName>1</sld:SourceChannelName>
              </sld:GrayChannel>
            </sld:ChannelSelection>
            <sld:ColorMap type="ramp">
              <sld:ColorMapEntry color="#fef9ae" quantity="0" label="0.0000"/>
              <sld:ColorMapEntry color="#fd9242" quantity="15.453926086425749" label="15.4539"/>
              <sld:ColorMapEntry color="#ff0094" quantity="30.907852172851499" label="30.9079"/>
              <sld:ColorMapEntry color="#0602f2" quantity="46.361778259277244" label="46.3618"/>
              <sld:ColorMapEntry color="#040058" quantity="61.815704345702997" label="61.8157"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </UserLayer>
</StyledLayerDescriptor>

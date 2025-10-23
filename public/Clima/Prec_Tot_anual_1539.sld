<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld" version="1.0.0">
  <UserLayer>
    <sld:LayerFeatureConstraints>
      <sld:FeatureTypeConstraint/>
    </sld:LayerFeatureConstraints>
    <sld:UserStyle>
      <sld:Name>Prec_Total_anual_1539</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:RasterSymbolizer>
            <sld:Opacity>0.8</sld:Opacity>
            <sld:ChannelSelection>
              <sld:GrayChannel>
                <sld:SourceChannelName>1</sld:SourceChannelName>
              </sld:GrayChannel>
            </sld:ChannelSelection>
            <sld:ColorMap type="intervals">
              <sld:ColorMapEntry color="#fffee3" quantity="400" label="&lt;= 400"/>
              <sld:ColorMapEntry color="#deea51" quantity="600" label="400 - 600"/>
              <sld:ColorMapEntry color="#ccf162" quantity="800" label="600 - 800"/>
              <sld:ColorMapEntry color="#68d849" quantity="1000" label="800 - 1000"/>
              <sld:ColorMapEntry color="#2db242" quantity="1200" label="1000 - 1200"/>
              <sld:ColorMapEntry color="#3a8a79" quantity="1400" label="1200 - 1400"/>
              <sld:ColorMapEntry color="#5c6fd1" quantity="1600" label="1400 - 1600"/>
              <sld:ColorMapEntry color="#4843d4" quantity="1800" label="1600 - 1800"/>
              <sld:ColorMapEntry color="#550056" quantity="inf" label="> 1800"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </UserLayer>
</StyledLayerDescriptor>

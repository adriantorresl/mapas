<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld" version="1.0.0">
  <UserLayer>
    <sld:LayerFeatureConstraints>
      <sld:FeatureTypeConstraint/>
    </sld:LayerFeatureConstraints>
    <sld:UserStyle>
      <sld:Name>Prec_Total_anual</sld:Name>
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
              <sld:ColorMapEntry color="#f0f5a0" quantity="400" label="&lt;= 400"/>
              <sld:ColorMapEntry color="#d4ec53" quantity="600" label="400 - 600"/>
              <sld:ColorMapEntry color="#95e457" quantity="800" label="600 - 800"/>
              <sld:ColorMapEntry color="#2fc638" quantity="1000" label="800 - 1000"/>
              <sld:ColorMapEntry color="#2ebb3e" quantity="1040" label="1000 - 1040"/>
              <sld:ColorMapEntry color="#30935e" quantity="1200" label="1040 - 1200"/>
              <sld:ColorMapEntry color="#5376ba" quantity="1400" label="1200 - 1400"/>
              <sld:ColorMapEntry color="#504ddb" quantity="1600" label="1400 - 1600"/>
              <sld:ColorMapEntry color="#372abc" quantity="1800" label="1600 - 1800"/>
              <sld:ColorMapEntry color="#550056" quantity="inf" label="> 1800"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </UserLayer>
</StyledLayerDescriptor>

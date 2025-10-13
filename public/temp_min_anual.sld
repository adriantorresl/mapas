<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" version="1.0.0">
  <UserLayer>
    <sld:LayerFeatureConstraints>
      <sld:FeatureTypeConstraint/>
    </sld:LayerFeatureConstraints>
    <sld:UserStyle>
      <sld:Name>Temp_min_anual</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:RasterSymbolizer>
            <sld:Opacity>0.7</sld:Opacity>
            <sld:ChannelSelection>
              <sld:GrayChannel>
                <sld:SourceChannelName>1</sld:SourceChannelName>
              </sld:GrayChannel>
            </sld:ChannelSelection>
            <sld:ColorMap type="ramp">
              <sld:ColorMapEntry color="#143180" quantity="4" label="4.0"/>
              <sld:ColorMapEntry color="#234b89" quantity="6" label="6.0"/>
              <sld:ColorMapEntry color="#326491" quantity="8" label="8.0"/>
              <sld:ColorMapEntry color="#5098a2" quantity="10" label="10.0"/>
              <sld:ColorMapEntry color="#6eccb3" quantity="12" label="12.0"/>
              <sld:ColorMapEntry color="#75e38f" quantity="14" label="14.0"/>
              <sld:ColorMapEntry color="#7cfa6b" quantity="16" label="16.0"/>
              <sld:ColorMapEntry color="#bdfa8c" quantity="18" label="18.0"/>
              <sld:ColorMapEntry color="#fffbae" quantity="20" label="20.0"/>
              <sld:ColorMapEntry color="#ffe17f" quantity="22" label="22.0"/>
              <sld:ColorMapEntry color="#ffc750" quantity="24" label="24.0"/>
              <sld:ColorMapEntry color="#ffad21" quantity="26" label="26.0"/>
              <sld:ColorMapEntry color="#e8651f" quantity="28" label="28.0"/>
              <sld:ColorMapEntry color="#d21d1d" quantity="30" label="30.0"/>
              <sld:ColorMapEntry color="#4a2121" quantity="34" label="34.0"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </UserLayer>
</StyledLayerDescriptor>

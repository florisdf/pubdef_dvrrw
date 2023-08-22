<template>
  <Renderer ref="renderer" alpha width="868" height="552">
    <Camera :position="{ z: 10 }" />
    <Scene>
      <PointLight :position="{ y: 50, z: 50 }" />
      <Mesh>
          <PlaneGeometry />
          <StandardMaterial color="#ff0000" />
      </Mesh>
    </Scene>
  </Renderer>
</template>

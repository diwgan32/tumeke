module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
          "esmodules": true
        },
      },
    ],
  ],
  "plugins": [
      [
        "@babel/plugin-proposal-class-properties"
      ]
  ]
}
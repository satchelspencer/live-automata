{
  "targets": [
    {
      "target_name": "opencv",
      "cflags!": [ "-std=c++11" ],
      "cflags_cc!": [ "-fno-rtti"],
      "ldflags" : [
			  "-Wl,-rpath,'$$ORIGIN'"
		  ],
      "sources": [
        "src/addon.cc",
        "src/Util.cc",
        "src/Mat.cc",
        "src/VideoCapture.cc",
        "src/VideoWriter.cc",
        "src/PipeWriter.cc"
      ],
      "include_dirs": [
        "src",
        "/usr/local/include/opencv4/",
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [
			  "-lopencv_core -lopencv_highgui -lopencv_imgcodecs -lopencv_imgproc -lopencv_features2d -lopencv_calib3d -lopencv_photo -lopencv_objdetect -lopencv_ml -lopencv_video -lopencv_videoio -lopencv_videostab -lopencv_dnn -lopencv_face -lopencv_tracking -lopencv_xfeatures2d -lopencv_ximgproc -Wl,-rpath,/usr/local/Cellar/opencv/4.0.1/lib",
			  "-framework opencl"
		  ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
      "xcode_settings": {
        "OTHER_CFLAGS": [
          "-std=c++11",
          "-stdlib=libc++"
        ],
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "MACOSX_DEPLOYMENT_TARGET": "10.9"
      },
    }
  ]
}
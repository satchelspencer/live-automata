{
	"targets": [{
		"target_name": "opencv",
		"defines":[],
		"include_dirs" : [
			"/usr/local/Cellar/opencv/4.0.1/include/opencv4",
			"src",
			"<!(node -e \"require('nan')\")"
		],
		"libraries": [
			"-lopencv_core -lopencv_highgui -lopencv_imgcodecs -lopencv_imgproc -lopencv_features2d -lopencv_calib3d -lopencv_photo -lopencv_objdetect -lopencv_ml -lopencv_video -lopencv_videoio -lopencv_videostab -lopencv_dnn -lopencv_face -lopencv_tracking -lopencv_xfeatures2d -lopencv_ximgproc -Wl,-rpath,/usr/local/Cellar/opencv/4.0.1/lib",
			"-framework opencl"
		],
		"sources": [
			"src/index.cc",
			"src/Mat.cc",
			"src/Window.cc",
			"src/Image.cc",
			"src/ImgProc.cc",
			"src/VideoCapture.cc",
			"src/VideoWriter.cc"
		],
			"cflags" : [
			"-std=c++11"
		],
		"cflags!" : [
			"-fno-exceptions"
		],
		"cflags_cc!": [
			"-fno-rtti",
			"-fno-exceptions"
		],
		"ldflags" : [
			"-Wl,-rpath,'$$ORIGIN'"
		],
		"xcode_settings": {
			"OTHER_CFLAGS": [
				"-std=c++11",
				"-stdlib=libc++"
			],
			"GCC_ENABLE_CPP_EXCEPTIONS": "YES",
			"MACOSX_DEPLOYMENT_TARGET": "10.9"
		},
	}]
}

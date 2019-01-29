#include "Image.h"
#include "Mat.h"
//#include <opencv2/core/ocl.hpp>


//cv::ocl::setUseOpenCL(true);

NAN_METHOD(Imread) {
  std::string arg0 = *Nan::Utf8String(info[0]);
  cv::Mat * cvImg = new cv::Mat();
  * cvImg = cv::imread( arg0, cv::IMREAD_COLOR);//.getUMat(cv::ACCESS_READ);

  v8::Local<v8::Function> constructorFunc = Nan::New(Mat::constructor)->GetFunction();
  v8::Local<v8::Object> resMat = Nan::NewInstance(constructorFunc, 0, {}).ToLocalChecked();
  Mat * res = Nan::ObjectWrap::Unwrap<Mat>(resMat);

  res->mat = cvImg;
  
  info.GetReturnValue().Set(resMat);
}
#include "Image.h"
#include "Mat.h"

NAN_METHOD(Imread) {
  std::string arg0 = *Nan::Utf8String(info[0]);
  cv::Mat * cvImg = new cv::Mat();
  * cvImg = cv::imread( arg0, cv::IMREAD_COLOR);

  v8::Local<v8::Function> constructorFunc = Nan::New(Mat::constructor)->GetFunction();
  v8::Local<v8::Object> resMat = Nan::NewInstance(constructorFunc, 0, {}).ToLocalChecked();
  Mat * res = Nan::ObjectWrap::Unwrap<Mat>(resMat);

  res->mat = cvImg;
  
  info.GetReturnValue().Set(resMat);
}
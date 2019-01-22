#include "Window.h"
#include "Mat.h"

NAN_METHOD(NamedWindow) {
  std::string arg0 = *Nan::Utf8String(info[0]);
  cv::namedWindow( arg0, cv::WINDOW_NORMAL );
}

NAN_METHOD(Imshow) {
  std::string arg0 = *Nan::Utf8String(info[0]);
  Mat * mat = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  cv::imshow( arg0, * mat->mat);
}

NAN_METHOD(WaitKey) {
  int res = cv::waitKey(info[0]->Int32Value());
  info.GetReturnValue().Set(Nan::New(res));
}

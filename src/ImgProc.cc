#include "ImgProc.h"
#include "Mat.h"

NAN_METHOD(Resize) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  cv::resize( *src->mat, * dest->mat, dest->mat->size(), 0, 0, cv::INTER_AREA);
}
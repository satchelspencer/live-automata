#include "ImgProc.h"
#include "Mat.h"

NAN_METHOD(Resize) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  cv::resize( *src->mat, * dest->mat, dest->mat->size(), 0, 0, cv::INTER_AREA);
}

NAN_METHOD(Add) {
  Mat * a = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * b = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::add( * a->mat, * b->mat, * dest->mat);
}

NAN_METHOD(Subtract) {
  Mat * a = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * b = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::subtract( * a->mat, * b->mat, * dest->mat);
}

NAN_METHOD(Invert) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  cv::subtract( cv::Scalar::all(255), * src->mat, * dest->mat);
}

NAN_METHOD(Multiply) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  double scalar = info[1]->NumberValue();
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::multiply( * src-> mat, scalar, * dest->mat);
}
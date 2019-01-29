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
  Mat * mult = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  double scalar = info[3]->NumberValue();
  cv::multiply( * src-> mat, *mult->mat, * dest->mat, scalar);
}

NAN_METHOD(AddWeighted) {
  Mat * src1 = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  double alpha = info[1]->NumberValue();
  Mat * src2 = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  double beta = info[3]->NumberValue();
  double gamma = info[4]->NumberValue();
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[5]->ToObject());
  cv::addWeighted( * src1-> mat, alpha, *src2->mat, beta, gamma, * dest->mat);
}

NAN_METHOD(MulConstant) {
  Mat * src1 = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  double gamma = info[1]->NumberValue();
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::multiply( * src1-> mat, gamma, * dest->mat);
}

NAN_METHOD(AbsDiff) {
  Mat * a = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * b = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::absdiff( * a->mat, * b->mat, * dest->mat);
}

NAN_METHOD(Blur) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  int size = info[2]->Int32Value();
  cv::blur(*src->mat,*dest->mat,cv::Size(size,size));
}

NAN_METHOD(Threshold) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  double min = info[2]->NumberValue();
  double max = info[3]->NumberValue();
  cv::threshold(*src->mat,*dest->mat,min,max,cv::THRESH_BINARY);
}

NAN_METHOD(CvtColor) {
  Mat * src = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  int type = info[1]->Int32Value();
  cv::cvtColor(*src->mat,*src->mat,type);
}

NAN_METHOD(Max) {
  Mat * a = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * b = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::max( * a->mat, * b->mat, * dest->mat);
}

NAN_METHOD(And) {
  Mat * a = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  Mat * b = Nan::ObjectWrap::Unwrap<Mat>(info[1]->ToObject());
  Mat * dest = Nan::ObjectWrap::Unwrap<Mat>(info[2]->ToObject());
  cv::bitwise_and( * a->mat, * b->mat, * dest->mat);
}
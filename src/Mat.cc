#include "Mat.h"

Nan::Persistent<v8::FunctionTemplate> Mat::constructor;

NAN_MODULE_INIT(Mat::Init) {
  v8::Local<v8::FunctionTemplate> ctor = Nan::New<v8::FunctionTemplate>(Mat::New);
  constructor.Reset(ctor);
  ctor->InstanceTemplate()->SetInternalFieldCount(1);
  ctor->SetClassName(Nan::New("Mat").ToLocalChecked());

  Nan::SetPrototypeMethod(ctor, "roi", Roi);
  Nan::SetPrototypeMethod(ctor, "copyTo", CopyTo);

  target->Set(Nan::New("Mat").ToLocalChecked(), ctor->GetFunction());  

}


NAN_METHOD(Mat::New) {
  if(!info.IsConstructCall()) {
    return Nan::ThrowError(Nan::New("Mat::New - called without new keyword").ToLocalChecked());
  }

  Mat* mat = new Mat();
  mat->Wrap(info.Holder());

  if(info.Length() == 0) {
    mat->mat = new cv::Mat();
  }else if(info.Length() == 3){
    mat->mat = new cv::Mat(info[0]->Int32Value(), info[1]->Int32Value(), info[2]->Int32Value());
  }else{
    return Nan::ThrowError(Nan::New("Mat::New - bad args").ToLocalChecked());
  }
  info.GetReturnValue().Set(info.Holder());
}

NAN_METHOD(Mat::Roi) {
  Mat * self = Nan::ObjectWrap::Unwrap<Mat>(info.This());
  cv::Mat selfMat = * self->mat;

  v8::Local<v8::Function> constructorFunc = Nan::New(Mat::constructor)->GetFunction();
  v8::Local<v8::Object> resMat = Nan::NewInstance(constructorFunc, 0, {}).ToLocalChecked();
  Mat * res = Nan::ObjectWrap::Unwrap<Mat>(resMat);

  cv::Mat * rmat = new cv::Mat();
  * rmat = selfMat(cv::Rect(info[0]->Int32Value(),info[1]->Int32Value(),info[2]->Int32Value(),info[3]->Int32Value()));
  res->mat = rmat;
  
  info.GetReturnValue().Set(resMat);
}

NAN_METHOD(Mat::CopyTo) {
  Mat * self = Nan::ObjectWrap::Unwrap<Mat>(info.This());
  Mat * destMat = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  self->mat->copyTo(* destMat->mat);
}

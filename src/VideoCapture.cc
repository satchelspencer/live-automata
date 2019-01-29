#include "VideoCapture.h"
#include "Mat.h"

Nan::Persistent<v8::FunctionTemplate> VideoCapture::constructor;

NAN_MODULE_INIT(VideoCapture::Init) {
  v8::Local<v8::FunctionTemplate> ctor = Nan::New<v8::FunctionTemplate>(VideoCapture::New);
  constructor.Reset(ctor);
  ctor->InstanceTemplate()->SetInternalFieldCount(1);
  ctor->SetClassName(Nan::New("VideoCapture").ToLocalChecked());

  Nan::SetPrototypeMethod(ctor, "read", Read);

  Nan::SetPrototypeMethod(ctor, "release", Release);

  target->Set(Nan::New("VideoCapture").ToLocalChecked(), ctor->GetFunction());  

}


NAN_METHOD(VideoCapture::New) {
  if(!info.IsConstructCall()) {
    return Nan::ThrowError(Nan::New("VideoCapture::New - called without new keyword").ToLocalChecked());
  }

  VideoCapture* cap = new VideoCapture();
  cap->Wrap(info.Holder());

  if(info[0]->IsNumber()){ //live capture
    cap->cap = new cv::VideoCapture(info[0]->Int32Value());
  }else{ //from disk
    std::string arg0 = *Nan::Utf8String(info[0]);
    cap->cap = new cv::VideoCapture(arg0);
  }

  info.GetReturnValue().Set(info.Holder());
}

class ReadWorker : public Nan::AsyncWorker {
  public:
    cv::VideoCapture * capture;
    cv::Mat * dest;

  ReadWorker(
    cv::VideoCapture * capture,
    cv::Mat * dest,
    Nan::Callback *callback
  ) :
   Nan::AsyncWorker(callback),
   capture(capture),
   dest(dest) {}

  void Execute() {
    capture->read(* dest);
  }
};

NAN_METHOD(VideoCapture::Read) {
  VideoCapture * self = Nan::ObjectWrap::Unwrap<VideoCapture>(info.This());
  Mat * destMat = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  // Nan::AsyncQueueWorker(new ReadWorker(
  //   self->cap,
  //   destMat->mat,
  //   new Nan::Callback(info[1].As<v8::Function>())
  // ));
  self->cap->read(* destMat->mat);
}

NAN_METHOD(VideoCapture::Release) {
  VideoCapture * self = Nan::ObjectWrap::Unwrap<VideoCapture>(info.This());
  self->cap->release();
}
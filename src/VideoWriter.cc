#include "VideoWriter.h"
#include "Mat.h"

Nan::Persistent<v8::FunctionTemplate> VideoWriter::constructor;

NAN_MODULE_INIT(VideoWriter::Init) {
  v8::Local<v8::FunctionTemplate> ctor = Nan::New<v8::FunctionTemplate>(VideoWriter::New);
  constructor.Reset(ctor);
  ctor->InstanceTemplate()->SetInternalFieldCount(1);
  ctor->SetClassName(Nan::New("VideoWriter").ToLocalChecked());

  Nan::SetPrototypeMethod(ctor, "write", Write);

  target->Set(Nan::New("VideoWriter").ToLocalChecked(), ctor->GetFunction());  

}


NAN_METHOD(VideoWriter::New) {
  VideoWriter* video = new VideoWriter();
  video->Wrap(info.Holder());

  std::string path = *Nan::Utf8String(info[0]);
  int width = info[1]->Int32Value();
  int height = info[2]->Int32Value();

  video->writer = new cv::VideoWriter(path, cv::VideoWriter::fourcc('P','I','M','1'),30,cv::Size(width,height),true);
  video->writer->set(cv::VIDEOWRITER_PROP_QUALITY, 100);

  info.GetReturnValue().Set(info.Holder());
}

NAN_METHOD(VideoWriter::Write) {
  VideoWriter * self = Nan::ObjectWrap::Unwrap<VideoWriter>(info.This());
  Mat * srcMat = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  self->writer->write(* srcMat->mat);
}
#include "PipeWriter.h"
#include "Mat.h"
#include "unistd.h"

Nan::Persistent<v8::FunctionTemplate> PipeWriter::constructor;

NAN_MODULE_INIT(PipeWriter::Init) {
  v8::Local<v8::FunctionTemplate> ctor = Nan::New<v8::FunctionTemplate>(PipeWriter::New);
  constructor.Reset(ctor);
  ctor->InstanceTemplate()->SetInternalFieldCount(1);
  ctor->SetClassName(Nan::New("PipeWriter").ToLocalChecked());

  Nan::SetPrototypeMethod(ctor, "write", Write);

  target->Set(Nan::New("PipeWriter").ToLocalChecked(), ctor->GetFunction());  

}


NAN_METHOD(PipeWriter::New) {
  PipeWriter* video = new PipeWriter();
  video->Wrap(info.Holder());

  std::string path = *Nan::Utf8String(info[0]);

  mkfifo(path.c_str(), 0666);
  video->fd = open(path.c_str(),O_WRONLY);

  info.GetReturnValue().Set(info.Holder());
}

NAN_METHOD(PipeWriter::Write) {
  PipeWriter * self = Nan::ObjectWrap::Unwrap<PipeWriter>(info.This());
  Mat * srcMat = Nan::ObjectWrap::Unwrap<Mat>(info[0]->ToObject());
  size_t bytes = srcMat->mat->total() * srcMat->mat->elemSize();
  write(self->fd, srcMat->mat->data, bytes);
}
#include <nan.h>
#include "Mat.h"
#include "Window.h"
#include "Image.h"
#include "ImgProc.h"
#include "VideoCapture.h"

NAN_MODULE_INIT(InitModule) {  
  Mat::Init(target);

  VideoCapture::Init(target);

  target->Set(
    Nan::New("namedWindow").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(NamedWindow)->GetFunction()
  );

  target->Set(
    Nan::New("imshow").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Imshow)->GetFunction()
  );

  target->Set(
    Nan::New("waitKey").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(WaitKey)->GetFunction()
  );

   target->Set(
    Nan::New("imread").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Imread)->GetFunction()
  );

  target->Set(
    Nan::New("resize").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Resize)->GetFunction()
  );

  target->Set(
    Nan::New("add").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Add)->GetFunction()
  );

  target->Set(
    Nan::New("subtract").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Subtract)->GetFunction()
  );

  target->Set(
    Nan::New("invert").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Invert)->GetFunction()
  );

  target->Set(
    Nan::New("multiply").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Multiply)->GetFunction()
  );

  target->Set(
    Nan::New("addWeighted").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(AddWeighted)->GetFunction()
  );

  target->Set(
    Nan::New("absdiff").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(AbsDiff)->GetFunction()
  );

  target->Set(
    Nan::New("blur").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Blur)->GetFunction()
  );

  target->Set(
    Nan::New("threshold").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Threshold)->GetFunction()
  );

  target->Set(
    Nan::New("cvtColor").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(CvtColor)->GetFunction()
  );

  target->Set(
    Nan::New("max").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(Max)->GetFunction()
  );

  target->Set(
    Nan::New("and").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(And)->GetFunction()
  );
}

NODE_MODULE(myModule, InitModule);
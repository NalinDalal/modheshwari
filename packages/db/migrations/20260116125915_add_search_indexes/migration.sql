-- CreateIndex
CREATE INDEX "Profile_profession_idx" ON "Profile"("profession");

-- CreateIndex
CREATE INDEX "Profile_gotra_idx" ON "Profile"("gotra");

-- CreateIndex
CREATE INDEX "Profile_bloodGroup_idx" ON "Profile"("bloodGroup");

-- CreateIndex
CREATE INDEX "Profile_location_idx" ON "Profile"("location");

-- CreateIndex
CREATE INDEX "Profile_status_idx" ON "Profile"("status");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");
